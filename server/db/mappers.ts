import type { BookingRow } from './client.js';
import type { BookingRecord } from './types.js';

type BookingInsert = {
  id: string;
  patientId: string | null;
  patientName: string;
  patientPhone: string;
  gender: string;
  birthDate: string;
  visitorCount: number;
  doctorId: string;
  treatmentId: string;
  date: string;
  timeSlot: string;
  symptoms: string | null;
  wechatNotify: number;
  wechatId: string | null;
  status: string;
  source: string | null;
  queueCode: string | null;
  queueSeq: number | null;
  queueStatus: string | null;
  queuePriority: number;
  checkedInAt: string | null;
  calledAt: string | null;
  recallCount: number;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
};

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s-]/g, '');
}

export function rowToBooking(row: BookingRow): BookingRecord {
  return {
    id: row.id,
    patientName: row.patient_name,
    patientPhone: row.patient_phone,
    gender: row.gender as BookingRecord['gender'],
    birthDate: row.birth_date,
    visitorCount: row.visitor_count,
    doctorId: row.doctor_id,
    treatmentId: row.treatment_id,
    date: row.date,
    timeSlot: row.time_slot,
    symptoms: row.symptoms ?? undefined,
    wechatNotify: row.wechat_notify ? true : undefined,
    wechatId: row.wechat_id ?? undefined,
    createdTime: row.created_at,
    status: row.status as BookingRecord['status'],
    source: (row.source as BookingRecord['source']) ?? undefined,
    queueCode: row.queue_code ?? undefined,
    queueSeq: row.queue_seq ?? undefined,
    queueStatus: (row.queue_status as BookingRecord['queueStatus']) ?? undefined,
    queuePriority: row.queue_priority ? true : undefined,
    checkedInAt: row.checked_in_at ?? undefined,
    calledAt: row.called_at ?? undefined,
    recallCount: row.recall_count ?? undefined,
  };
}

export function bookingToInsert(
  record: BookingRecord,
  patientId: string | null,
  updatedAt?: string
): BookingInsert {
  const now = updatedAt ?? record.createdTime;
  return {
    id: record.id,
    patientId,
    patientName: record.patientName,
    patientPhone: normalizePhone(record.patientPhone),
    gender: record.gender,
    birthDate: record.birthDate,
    visitorCount: record.visitorCount,
    doctorId: record.doctorId,
    treatmentId: record.treatmentId,
    date: record.date,
    timeSlot: record.timeSlot,
    symptoms: record.symptoms ?? null,
    wechatNotify: record.wechatNotify ? 1 : 0,
    wechatId: record.wechatId ?? null,
    status: record.status,
    source: record.source ?? null,
    queueCode: record.queueCode ?? null,
    queueSeq: record.queueSeq ?? null,
    queueStatus: record.queueStatus ?? null,
    queuePriority: record.queuePriority ? 1 : 0,
    checkedInAt: record.checkedInAt ?? null,
    calledAt: record.calledAt ?? null,
    recallCount: record.recallCount ?? 0,
    createdAt: record.createdTime,
    updatedAt: now,
    cancelledAt: record.status === 'cancelled' ? now : null,
  };
}

export function patchToBookingUpdate(
  patch: Partial<BookingRecord>,
  updatedAt: string
): Partial<BookingInsert> {
  const out: Partial<BookingInsert> = { updatedAt };

  if (patch.patientName !== undefined) out.patientName = patch.patientName;
  if (patch.patientPhone !== undefined) {
    out.patientPhone = normalizePhone(patch.patientPhone);
  }
  if (patch.gender !== undefined) out.gender = patch.gender;
  if (patch.birthDate !== undefined) out.birthDate = patch.birthDate;
  if (patch.visitorCount !== undefined) out.visitorCount = patch.visitorCount;
  if (patch.doctorId !== undefined) out.doctorId = patch.doctorId;
  if (patch.treatmentId !== undefined) out.treatmentId = patch.treatmentId;
  if (patch.date !== undefined) out.date = patch.date;
  if (patch.timeSlot !== undefined) out.timeSlot = patch.timeSlot;
  if (patch.symptoms !== undefined) out.symptoms = patch.symptoms ?? null;
  if (patch.wechatNotify !== undefined) out.wechatNotify = patch.wechatNotify ? 1 : 0;
  if (patch.wechatId !== undefined) out.wechatId = patch.wechatId ?? null;
  if (patch.status !== undefined) {
    out.status = patch.status;
    if (patch.status === 'cancelled') out.cancelledAt = updatedAt;
  }
  if (patch.source !== undefined) out.source = patch.source ?? null;
  if (patch.queueCode !== undefined) out.queueCode = patch.queueCode ?? null;
  if (patch.queueSeq !== undefined) out.queueSeq = patch.queueSeq ?? null;
  if (patch.queueStatus !== undefined) out.queueStatus = patch.queueStatus ?? null;
  if (patch.queuePriority !== undefined) out.queuePriority = patch.queuePriority ? 1 : 0;
  if (patch.checkedInAt !== undefined) out.checkedInAt = patch.checkedInAt ?? null;
  if (patch.calledAt !== undefined) out.calledAt = patch.calledAt ?? null;
  if (patch.recallCount !== undefined) out.recallCount = patch.recallCount ?? 0;
  if (patch.createdTime !== undefined) out.createdAt = patch.createdTime;

  return out;
}
