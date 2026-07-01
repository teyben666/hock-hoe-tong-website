import { getSqlite, withTransaction, type BookingRow } from './client.js';
import type { BookingRecord, PatientIdentity } from './types.js';
import {
  bookingToInsert,
  normalizePhone,
  patchToBookingUpdate,
  rowToBooking,
} from './mappers.js';

function newPatientId(): string {
  return `pt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function selectAllRows(): BookingRow[] {
  return getSqlite()
    .prepare('SELECT * FROM bookings')
    .all() as BookingRow[];
}

function selectRowById(id: string): BookingRow | undefined {
  return getSqlite()
    .prepare('SELECT * FROM bookings WHERE id = ?')
    .get(id) as BookingRow | undefined;
}

export function upsertPatientFromIdentity(
  data: PatientIdentity,
  wechatId?: string
): string {
  const phone = normalizePhone(data.patientPhone);
  const db = getSqlite();
  const existing = db
    .prepare('SELECT id, wechat_id FROM patients WHERE phone = ?')
    .get(phone) as { id: string; wechat_id: string | null } | undefined;
  const now = nowIso();

  if (existing) {
    db.prepare(
      `UPDATE patients
       SET name = ?, gender = ?, birth_date = ?, wechat_id = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      data.patientName.trim(),
      data.gender,
      data.birthDate,
      wechatId ?? existing.wechat_id,
      now,
      existing.id
    );
    return existing.id;
  }

  const id = newPatientId();
  db.prepare(
    `INSERT INTO patients (id, phone, name, gender, birth_date, wechat_id, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)`
  ).run(
    id,
    phone,
    data.patientName.trim(),
    data.gender,
    data.birthDate,
    wechatId ?? null,
    now,
    now
  );
  return id;
}

function isWalkInSlot(timeSlot: string): boolean {
  return !timeSlot || timeSlot === 'walk-in';
}

function insertRow(record: BookingRecord, patientId: string | null): void {
  const row = bookingToInsert(record, patientId);
  getSqlite()
    .prepare(
      `INSERT INTO bookings (
        id, patient_id, patient_name, patient_phone, gender, birth_date, visitor_count,
        doctor_id, treatment_id, date, time_slot, symptoms, wechat_notify, wechat_id,
        status, source, queue_code, queue_seq, queue_status, queue_priority,
        checked_in_at, called_at, recall_count, created_at, updated_at, cancelled_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )`
    )
    .run(
      row.id,
      row.patientId,
      row.patientName,
      row.patientPhone,
      row.gender,
      row.birthDate,
      row.visitorCount,
      row.doctorId,
      row.treatmentId,
      row.date,
      row.timeSlot,
      row.symptoms,
      row.wechatNotify,
      row.wechatId,
      row.status,
      row.source,
      row.queueCode,
      row.queueSeq,
      row.queueStatus,
      row.queuePriority,
      row.checkedInAt,
      row.calledAt,
      row.recallCount,
      row.createdAt,
      row.updatedAt,
      row.cancelledAt
    );
}

export function selectAllBookings(): BookingRecord[] {
  return selectAllRows().map(rowToBooking);
}

export function selectActiveBookings(): BookingRecord[] {
  return getSqlite()
    .prepare('SELECT * FROM bookings WHERE status != ?')
    .all('cancelled')
    .map((row) => rowToBooking(row as BookingRow));
}

export function selectBookingsByPhone(phone: string): BookingRecord[] {
  const normalized = normalizePhone(phone);
  return getSqlite()
    .prepare('SELECT * FROM bookings WHERE patient_phone = ? AND status != ?')
    .all(normalized, 'cancelled')
    .map((row) => rowToBooking(row as BookingRow));
}

export function selectBookingsByDate(date: string): BookingRecord[] {
  return getSqlite()
    .prepare('SELECT * FROM bookings WHERE date = ? AND status != ?')
    .all(date, 'cancelled')
    .map((row) => rowToBooking(row as BookingRow));
}

export function selectBookingById(id: string): BookingRecord | undefined {
  const row = selectRowById(id);
  return row ? rowToBooking(row) : undefined;
}

export function isSlotBookedInDb(date: string, timeSlot: string): boolean {
  if (isWalkInSlot(timeSlot)) return false;
  const row = getSqlite()
    .prepare(
      `SELECT id FROM bookings
       WHERE date = ? AND time_slot = ? AND status != 'cancelled'
         AND time_slot != 'walk-in'
         AND (source IS NULL OR source != 'walk_in')
       LIMIT 1`
    )
    .get(date, timeSlot);
  return Boolean(row);
}

export function insertBookingRecord(record: BookingRecord): BookingRecord {
  const patientId = upsertPatientFromIdentity(
    {
      patientName: record.patientName,
      patientPhone: record.patientPhone,
      gender: record.gender,
      birthDate: record.birthDate,
    },
    record.wechatId
  );
  insertRow(record, patientId);
  return record;
}

export function importBookingRecords(records: BookingRecord[]): number {
  let count = 0;
  withTransaction(() => {
    for (const record of records) {
      if (selectRowById(record.id)) continue;
      insertBookingRecord(record);
      count += 1;
    }
  });
  return count;
}

export function replaceAllBookings(records: BookingRecord[]): void {
  withTransaction(() => {
    getSqlite().prepare('DELETE FROM bookings').run();
    for (const record of records) {
      insertBookingRecord(record);
    }
  });
}

export function cancelBookingInDb(id: string): boolean {
  const now = nowIso();
  const result = getSqlite()
    .prepare(
      `UPDATE bookings SET status = 'cancelled', cancelled_at = ?, updated_at = ? WHERE id = ?`
    )
    .run(now, now, id);
  return Number(result.changes) > 0;
}

export function confirmBookingInDb(id: string): BookingRecord | null {
  const now = nowIso();
  getSqlite()
    .prepare(`UPDATE bookings SET status = 'confirmed', updated_at = ? WHERE id = ?`)
    .run(now, id);
  return selectBookingById(id) ?? null;
}

export function updateBookingInDb(
  id: string,
  patch: Partial<BookingRecord>
): BookingRecord | null {
  const existing = selectBookingById(id);
  if (!existing) return null;

  const now = nowIso();
  const update = patchToBookingUpdate(patch, now);
  let patientId: string | null | undefined;

  if (
    patch.patientName !== undefined ||
    patch.patientPhone !== undefined ||
    patch.gender !== undefined ||
    patch.birthDate !== undefined
  ) {
    const merged: PatientIdentity = {
      patientName: patch.patientName ?? existing.patientName,
      patientPhone: patch.patientPhone ?? existing.patientPhone,
      gender: patch.gender ?? existing.gender,
      birthDate: patch.birthDate ?? existing.birthDate,
    };
    patientId = upsertPatientFromIdentity(merged, patch.wechatId ?? existing.wechatId);
  }

  const sets: string[] = ['updated_at = ?'];
  const values: (string | number | null)[] = [update.updatedAt!];

  const add = (column: string, value: string | number | null | undefined) => {
    if (value !== undefined) {
      sets.push(`${column} = ?`);
      values.push(value);
    }
  };

  if (patientId !== undefined) add('patient_id', patientId);
  add('patient_name', update.patientName);
  add('patient_phone', update.patientPhone);
  add('gender', update.gender);
  add('birth_date', update.birthDate);
  add('visitor_count', update.visitorCount);
  add('doctor_id', update.doctorId);
  add('treatment_id', update.treatmentId);
  add('date', update.date);
  add('time_slot', update.timeSlot);
  add('symptoms', update.symptoms);
  add('wechat_notify', update.wechatNotify);
  add('wechat_id', update.wechatId);
  add('status', update.status);
  add('source', update.source);
  add('queue_code', update.queueCode);
  add('queue_seq', update.queueSeq);
  add('queue_status', update.queueStatus);
  add('queue_priority', update.queuePriority);
  add('checked_in_at', update.checkedInAt);
  add('called_at', update.calledAt);
  add('recall_count', update.recallCount);
  add('created_at', update.createdAt);
  add('cancelled_at', update.cancelledAt);

  values.push(id);
  getSqlite()
    .prepare(`UPDATE bookings SET ${sets.join(', ')} WHERE id = ?`)
    .run(...values);

  return selectBookingById(id) ?? null;
}
