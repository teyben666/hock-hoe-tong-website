/**
 * 统一叫号：预约 A 前缀 / 现场 W 前缀
 */

import {
  type BookingRecord,
  type QueueStatus,
  findBooking,
  getBookingsByDate,
  insertBooking,
  readAllBookings,
  updateBooking,
} from './db.js';
import { getClinicNow, getClinicToday, timeToMinutes } from './clinicTime.js';
import {
  getQueueCallMode,
  setQueueCallMode,
  recordAnnouncement,
  getLastAnnouncement,
  type QueueCallMode,
  type QueueAnnouncement,
} from './queueState.js';

export type { QueueAnnouncement };

export type { QueueCallMode, QueueStatus };

type BookingSource = 'appointment' | 'walk_in';

function normalizeSource(b: BookingRecord): BookingSource {
  if (b.source === 'walk_in' || b.timeSlot === 'walk-in') return 'walk_in';
  return 'appointment';
}

function withDefaults(b: BookingRecord): BookingRecord {
  return {
    ...b,
    source: normalizeSource(b),
    queueStatus: b.queueStatus ?? 'not_arrived',
    queuePriority: Boolean(b.queuePriority),
  };
}

function formatCode(prefix: 'A' | 'W', seq: number): string {
  return `${prefix}${String(seq).padStart(2, '0')}`;
}

function nextSeq(date: string, prefix: 'A' | 'W'): number {
  let max = 0;
  for (const b of readAllBookings()) {
    if (
      b.date === date &&
      b.status !== 'cancelled' &&
      b.queueSeq &&
      b.queueCode?.startsWith(prefix)
    ) {
      max = Math.max(max, b.queueSeq);
    }
  }
  return max + 1;
}

function assignQueueCode(record: BookingRecord, prefix: 'A' | 'W'): BookingRecord {
  if (record.queueCode && record.queueSeq) return record;
  const seq = nextSeq(record.date, prefix);
  return { ...record, queueSeq: seq, queueCode: formatCode(prefix, seq) };
}

export function maskName(name: string): string {
  const t = name.trim();
  if (t.length <= 1) return '*';
  if (t.length === 2) return `${t[0]}*`;
  return `${t[0]}*${t[t.length - 1]}`;
}

function isAppointmentCallable(b: BookingRecord, nowMinutes: number): boolean {
  if (normalizeSource(b) !== 'appointment' || !b.timeSlot || b.timeSlot === 'walk-in') {
    return false;
  }
  return timeToMinutes(b.timeSlot) <= nowMinutes;
}

function sortAppointments(a: BookingRecord, b: BookingRecord): number {
  const diff = timeToMinutes(a.timeSlot) - timeToMinutes(b.timeSlot);
  if (diff !== 0) return diff;
  return (a.checkedInAt ?? '').localeCompare(b.checkedInAt ?? '');
}

function sortWalkIns(a: BookingRecord, b: BookingRecord): number {
  return (a.queueSeq ?? 0) - (b.queueSeq ?? 0);
}

function todayActive(): BookingRecord[] {
  return getBookingsByDate(getClinicToday()).map(withDefaults);
}

function pickNext(mode: QueueCallMode): BookingRecord | null {
  const { minutes } = getClinicNow();
  const all = todayActive();

  const priority = all.filter((b) => b.queueStatus === 'waiting' && b.queuePriority);
  if (priority.length > 0) {
    const ap = priority.filter((b) => normalizeSource(b) === 'appointment');
    if (ap.length > 0) return ap.sort(sortAppointments)[0];
    return priority.filter((b) => normalizeSource(b) === 'walk_in').sort(sortWalkIns)[0];
  }

  const apptPool = all
    .filter(
      (b) =>
        b.queueStatus === 'waiting' &&
        normalizeSource(b) === 'appointment' &&
        isAppointmentCallable(b, minutes)
    )
    .sort(sortAppointments);

  const walkPool = all
    .filter((b) => b.queueStatus === 'waiting' && normalizeSource(b) === 'walk_in')
    .sort(sortWalkIns);

  if (mode === 'appointment') return apptPool[0] ?? null;
  if (mode === 'walkin') return walkPool[0] ?? null;
  return apptPool[0] ?? walkPool[0] ?? null;
}

/** 叫下一位前：其他「已叫号未进诊」自动过号，避免多人同时 called */
function autoSkipOtherCalled(exceptId: string): void {
  for (const b of todayActive()) {
    if (b.id !== exceptId && b.queueStatus === 'called') {
      updateBooking(b.id, { queueStatus: 'skipped', queuePriority: false });
    }
  }
}

/** 大屏/后台「当前号」：优先最近一次广播，否则 calledAt 最新的 called / in_service */
function resolveCurrent(all: BookingRecord[]): BookingRecord | null {
  const lastAnn = getLastAnnouncement();
  if (lastAnn) {
    const fromAnn = all.find((b) => b.id === lastAnn.bookingId);
    if (
      fromAnn &&
      (fromAnn.queueStatus === 'called' || fromAnn.queueStatus === 'in_service')
    ) {
      return fromAnn;
    }
  }

  const active = all.filter(
    (b) => b.queueStatus === 'called' || b.queueStatus === 'in_service'
  );
  if (active.length === 0) return null;

  active.sort((a, b) =>
    (b.calledAt ?? b.checkedInAt ?? '').localeCompare(
      a.calledAt ?? a.checkedInAt ?? ''
    )
  );
  return active[0];
}

function markCalled(record: BookingRecord): BookingRecord {
  autoSkipOtherCalled(record.id);
  const updated = updateBooking(record.id, {
    queueStatus: 'called',
    calledAt: new Date().toISOString(),
    queuePriority: false,
  })!;
  if (updated.queueCode) {
    recordAnnouncement(updated.id, updated.queueCode, 'call');
  }
  return updated;
}

export function checkInAppointment(id: string): BookingRecord {
  const b = findBooking(id);
  if (!b || b.status === 'cancelled') throw new Error('NOT_FOUND');
  if (normalizeSource(withDefaults(b)) !== 'appointment') throw new Error('NOT_APPOINTMENT');
  if (b.date !== getClinicToday()) throw new Error('NOT_TODAY');

  const existing = withDefaults(b);
  if (
    existing.queueCode &&
    existing.queueStatus &&
    !['not_arrived', 'skipped'].includes(existing.queueStatus)
  ) {
    throw new Error('ALREADY_CHECKED_IN');
  }

  const withCode = assignQueueCode(existing, 'A');
  return updateBooking(id, {
    queueCode: withCode.queueCode,
    queueSeq: withCode.queueSeq,
    queueStatus: 'waiting',
    checkedInAt: withCode.checkedInAt ?? new Date().toISOString(),
    queuePriority: false,
    source: 'appointment',
  })!;
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s-]/g, '');
}

export function hasActiveWalkInToday(phone: string): boolean {
  const normalized = normalizePhone(phone);
  const today = getClinicToday();
  return getBookingsByDate(today).some(
    (b) =>
      b.status !== 'cancelled' &&
      (b.source === 'walk_in' || b.timeSlot === 'walk-in') &&
      b.patientPhone.replace(/[\s-]/g, '') === normalized &&
      b.queueStatus !== 'done' &&
      b.queueStatus !== 'skipped'
  );
}

export function createWalkIn(data: {
  patientName: string;
  patientPhone: string;
  gender: BookingRecord['gender'];
  birthDate: string;
  treatmentId?: string;
  doctorId?: string;
  symptoms?: string;
}): BookingRecord {
  const today = getClinicToday();
  const phone = normalizePhone(data.patientPhone);
  if (hasActiveWalkInToday(phone)) {
    throw new Error('WALK_IN_EXISTS');
  }
  const record: BookingRecord = {
    id: `wi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    patientName: data.patientName.trim(),
    patientPhone: phone,
    gender: data.gender,
    birthDate: data.birthDate,
    visitorCount: 1,
    doctorId: data.doctorId ?? 'd1',
    treatmentId: data.treatmentId ?? 't2',
    date: today,
    timeSlot: 'walk-in',
    symptoms: data.symptoms?.trim() || '[现场取号]',
    createdTime: new Date().toISOString(),
    status: 'confirmed',
    source: 'walk_in',
    queueStatus: 'waiting',
    checkedInAt: new Date().toISOString(),
    queuePriority: false,
  };
  const withCode = assignQueueCode(record, 'W');
  return insertBooking(withCode);
}

export function callNext(modeOverride?: QueueCallMode) {
  const mode = modeOverride ?? getQueueCallMode();
  const next = pickNext(mode);
  if (!next) return { booking: null, mode };
  return { booking: markCalled(next), mode };
}

export function callBookingById(id: string): BookingRecord {
  const b = findBooking(id);
  if (!b || b.status === 'cancelled') throw new Error('NOT_FOUND');
  const w = withDefaults(b);
  if (w.queueStatus !== 'waiting') throw new Error('NOT_WAITING');
  return markCalled(w);
}

export function setQueuePriority(id: string, priority = true): BookingRecord {
  const b = findBooking(id);
  if (!b || b.status === 'cancelled') throw new Error('NOT_FOUND');
  if (withDefaults(b).queueStatus !== 'waiting') throw new Error('NOT_WAITING');
  return updateBooking(id, { queuePriority: priority })!;
}

export function setQueueStatus(id: string, queueStatus: QueueStatus): BookingRecord {
  const b = findBooking(id);
  if (!b || b.status === 'cancelled') throw new Error('NOT_FOUND');
  const patch: Partial<BookingRecord> = { queueStatus };
  if (queueStatus === 'done' || queueStatus === 'skipped') {
    patch.queuePriority = false;
  }
  return updateBooking(id, patch)!;
}

/** 重叫（广播）：保持 called / in_service，刷新 calledAt 供大屏与提示音 */
export function recallBooking(id: string): BookingRecord {
  const b = findBooking(id);
  if (!b || b.status === 'cancelled') throw new Error('NOT_FOUND');
  const w = withDefaults(b);
  if (w.queueStatus !== 'called' && w.queueStatus !== 'in_service') {
    throw new Error('NOT_RECALLABLE');
  }
  if (!w.queueCode) throw new Error('NO_QUEUE_CODE');

  const at = new Date().toISOString();
  const updated = updateBooking(id, {
    calledAt: at,
    recallCount: (b.recallCount ?? 0) + 1,
  })!;
  recordAnnouncement(updated.id, updated.queueCode!, 'recall');
  return updated;
}

/** 过号后再次排队（保留原 A/W 号） */
export function requeueBooking(id: string): BookingRecord {
  const b = findBooking(id);
  if (!b || b.status === 'cancelled') throw new Error('NOT_FOUND');
  const w = withDefaults(b);
  if (w.queueStatus !== 'skipped') throw new Error('NOT_REQUEUEABLE');
  if (!w.queueCode) throw new Error('NO_QUEUE_CODE');
  return updateBooking(id, {
    queueStatus: 'waiting',
    queuePriority: false,
  })!;
}

export function buildOrderedWaiting(): BookingRecord[] {
  const { minutes } = getClinicNow();
  const all = todayActive();
  const ordered: BookingRecord[] = [];
  const seen = new Set<string>();

  const add = (list: BookingRecord[]) => {
    for (const b of list) {
      if (!seen.has(b.id)) {
        ordered.push(b);
        seen.add(b.id);
      }
    }
  };

  add(
    all
      .filter((b) => b.queueStatus === 'waiting' && b.queuePriority)
      .sort((a, b) => {
        const sa = normalizeSource(a);
        const sb = normalizeSource(b);
        if (sa === 'appointment' && sb === 'walk_in') return -1;
        if (sa === 'walk_in' && sb === 'appointment') return 1;
        return sa === 'appointment' ? sortAppointments(a, b) : sortWalkIns(a, b);
      })
  );

  add(
    all
      .filter(
        (b) =>
          b.queueStatus === 'waiting' &&
          normalizeSource(b) === 'appointment' &&
          isAppointmentCallable(b, minutes)
      )
      .sort(sortAppointments)
  );

  add(
    all
      .filter((b) => b.queueStatus === 'waiting' && normalizeSource(b) === 'walk_in')
      .sort(sortWalkIns)
  );

  return ordered;
}

export function getQueueBoard(date?: string) {
  const d = date ?? getClinicToday();
  const { minutes, dateStr } = getClinicNow();
  const mode = getQueueCallMode();
  const all = getBookingsByDate(d).map(withDefaults);

  const called = all
    .filter((b) => b.queueStatus === 'called')
    .sort((a, b) => (b.calledAt ?? '').localeCompare(a.calledAt ?? ''));

  const currentRecord = resolveCurrent(all);

  const waitingAppointment = all
    .filter(
      (b) =>
        b.queueStatus === 'waiting' &&
        normalizeSource(b) === 'appointment' &&
        (d !== dateStr || isAppointmentCallable(b, minutes))
    )
    .sort(sortAppointments);

  const waitingWalkIn = all
    .filter((b) => b.queueStatus === 'waiting' && normalizeSource(b) === 'walk_in')
    .sort(sortWalkIns);

  const upcomingAppointment = all
    .filter((b) => {
      if (normalizeSource(b) !== 'appointment') return false;
      if (b.queueStatus === 'not_arrived' || !b.queueStatus) return true;
      return (
        b.queueStatus === 'waiting' &&
        d === dateStr &&
        !isAppointmentCallable(b, minutes)
      );
    })
    .sort(sortAppointments);

  const calledWaiting = called.filter((b) => b.queueStatus === 'called');

  const skippedToday = all
    .filter((b) => b.queueStatus === 'skipped')
    .sort((a, b) => (b.calledAt ?? b.checkedInAt ?? '').localeCompare(a.calledAt ?? a.checkedInAt ?? ''));

  return {
    date: d,
    mode,
    nowMinutes: minutes,
    lastAnnouncement: getLastAnnouncement(),
    current: currentRecord
      ? {
          id: currentRecord.id,
          queueCode: currentRecord.queueCode,
          maskedName: maskName(currentRecord.patientName),
          source: normalizeSource(currentRecord),
          queueStatus: currentRecord.queueStatus!,
        }
      : null,
    waitingAppointment: waitingAppointment.map((b) => ({
      id: b.id,
      queueCode: b.queueCode,
      timeSlot: b.timeSlot,
      maskedName: maskName(b.patientName),
      queuePriority: b.queuePriority,
      queueStatus: b.queueStatus,
      patientName: b.patientName,
      gender: b.gender,
      birthDate: b.birthDate,
    })),
    waitingWalkIn: waitingWalkIn.map((b) => ({
      id: b.id,
      queueCode: b.queueCode,
      maskedName: maskName(b.patientName),
      queuePriority: b.queuePriority,
      queueStatus: b.queueStatus,
      patientName: b.patientName,
      gender: b.gender,
      birthDate: b.birthDate,
    })),
    upcomingAppointment: upcomingAppointment.map((b) => ({
      id: b.id,
      queueCode: b.queueCode,
      timeSlot: b.timeSlot,
      maskedName: maskName(b.patientName),
      queuePriority: b.queuePriority,
      queueStatus: b.queueStatus,
      patientName: b.patientName,
      gender: b.gender,
      birthDate: b.birthDate,
    })),
    calledWaiting: calledWaiting.map((b) => ({
      id: b.id,
      queueCode: b.queueCode,
      timeSlot: b.timeSlot === 'walk-in' ? null : b.timeSlot,
      maskedName: maskName(b.patientName),
      queuePriority: b.queuePriority,
      queueStatus: b.queueStatus,
      patientName: b.patientName,
      gender: b.gender,
      birthDate: b.birthDate,
      source: normalizeSource(b),
    })),
    skippedToday: skippedToday.map((b) => ({
      id: b.id,
      queueCode: b.queueCode,
      timeSlot: b.timeSlot === 'walk-in' ? null : b.timeSlot,
      maskedName: maskName(b.patientName),
      queuePriority: b.queuePriority,
      queueStatus: b.queueStatus,
      patientName: b.patientName,
      gender: b.gender,
      birthDate: b.birthDate,
      source: normalizeSource(b),
    })),
    allToday: all.map((b) => ({
      id: b.id,
      queueCode: b.queueCode,
      source: normalizeSource(b),
      timeSlot: b.timeSlot === 'walk-in' ? null : b.timeSlot,
      queueStatus: b.queueStatus,
      queuePriority: b.queuePriority,
      patientName: b.patientName,
      patientPhone: b.patientPhone,
      gender: b.gender,
      birthDate: b.birthDate,
      maskedName: maskName(b.patientName),
    })),
  };
}

export function getQueueStatusByPhone(phone: string) {
  const normalized = phone.replace(/[\s-]/g, '');
  const today = getClinicToday();
  const { minutes } = getClinicNow();
  const mine = getBookingsByDate(today)
    .map(withDefaults)
    .filter((b) => b.patientPhone.replace(/[\s-]/g, '') === normalized);

  if (mine.length === 0) {
    return { found: false as const, date: today };
  }

  const board = getQueueBoard(today);
  const ordered = buildOrderedWaiting();

  const entries = mine.map((b) => {
    const idx = ordered.findIndex((w) => w.id === b.id);
    const callable =
      normalizeSource(b) === 'walk_in' || isAppointmentCallable(b, minutes);
    return {
      id: b.id,
      queueCode: b.queueCode,
      source: normalizeSource(b),
      timeSlot: b.timeSlot === 'walk-in' ? null : b.timeSlot,
      queueStatus: b.queueStatus,
      queuePriority: b.queuePriority,
      ahead: idx >= 0 ? idx : null,
      callable,
      patientName: b.patientName,
    };
  });

  return {
    found: true as const,
    date: today,
    mode: board.mode,
    current: board.current,
    entries,
  };
}

export { getQueueCallMode, setQueueCallMode, getLastAnnouncement, recordAnnouncement };
