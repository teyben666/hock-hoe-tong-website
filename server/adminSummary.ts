/**
 * 店员后台「总览」聚合数据（P1 + P2）
 */

import { readAllBookings, type BookingRecord } from './db.js';
import { getClinicToday, timeToMinutes } from './clinicTime.js';
import { isFullOffDay, offDayLabel } from './scheduleConfig.js';
import { getAllWellnessTips } from './wellnessTips.js';
import { buildMonthCompare } from './adminTrends.js';
import { getQueueBoard, maskName } from './queue.js';
import { getClinicStats } from './clinicStats.js';
import { getAvailabilityForDate } from './slots.js';
import type { QueueCallMode } from './queue.js';

const WAITING_STATUSES = new Set(['waiting', 'called', 'in_service']);

const TREATMENT_NAMES: Record<string, string> = {
  t1: '中药',
  t2: '针刺治疗',
  t3: '艾灸',
  t4: '拔罐',
  t5: '小儿推拿',
  t6: '颐玥臻膳',
};

function isDoneVisit(b: BookingRecord): boolean {
  return b.status !== 'cancelled' && b.queueStatus === 'done';
}

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function isAppointmentSlot(timeSlot: string | undefined): boolean {
  return Boolean(timeSlot && timeSlot !== 'walk-in');
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days, 12, 0, 0);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function pickNextAppointments(
  todayRecords: BookingRecord[],
  limit = 3
): { id: string; timeSlot: string; maskedName: string }[] {
  return todayRecords
    .filter(
      (b) =>
        b.status !== 'cancelled' &&
        isAppointmentSlot(b.timeSlot) &&
        b.queueStatus !== 'done' &&
        b.queueStatus !== 'skipped'
    )
    .sort((a, b) => timeToMinutes(a.timeSlot) - timeToMinutes(b.timeSlot))
    .slice(0, limit)
    .map((b) => ({
      id: b.id,
      timeSlot: b.timeSlot,
      maskedName: maskName(b.patientName),
    }));
}

function buildTodaySlots(date: string) {
  const avail = getAvailabilityForDate(date);
  const openSlots = avail.slots.filter((s) => !s.closed);
  const booked = openSlots.filter((s) => s.booked).length;
  const total = openSlots.length;
  return {
    booked,
    available: Math.max(0, total - booked),
    total,
    closed: avail.closed,
  };
}

function countBookedOnDate(all: BookingRecord[], date: string): number {
  return all.filter((b) => b.date === date && b.status !== 'cancelled').length;
}

function buildRecentDone(all: BookingRecord[], today: string) {
  const done = all.filter(isDoneVisit);
  const todayDone = done
    .filter((b) => b.date === today)
    .sort((a, b) => (b.calledAt ?? b.createdTime).localeCompare(a.calledAt ?? a.createdTime));
  const rest = done
    .filter((b) => b.date !== today)
    .sort((a, b) => (b.calledAt ?? b.createdTime).localeCompare(a.calledAt ?? a.createdTime));
  const merged = [...todayDone, ...rest].slice(0, 3);
  return merged.map((b) => ({
    queueCode: b.queueCode,
    maskedName: maskName(b.patientName),
    finishedAt: b.calledAt ?? b.createdTime,
  }));
}

function buildTodayByTreatment(todayActive: BookingRecord[]) {
  const counts = new Map<string, number>();
  for (const b of todayActive) {
    const id = b.treatmentId || 't2';
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([treatmentId, count]) => ({
      treatmentId,
      name: TREATMENT_NAMES[treatmentId] ?? treatmentId,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

function computeAvgWaitMinutes(todayRecords: BookingRecord[]): number | null {
  const diffs: number[] = [];
  for (const b of todayRecords) {
    if (!b.checkedInAt || !b.calledAt) continue;
    const ms = new Date(b.calledAt).getTime() - new Date(b.checkedInAt).getTime();
    if (ms >= 0) diffs.push(ms / 60_000);
  }
  if (diffs.length === 0) return null;
  return Math.round(diffs.reduce((a, c) => a + c, 0) / diffs.length);
}

const MODE_LABELS: Record<QueueCallMode, string> = {
  standard: '标准',
  appointment: '预约优先',
  walkin: '现场优先',
};

export interface AdminSummaryPayload {
  today: string;
  isOffDay: boolean;
  todayBooked: number;
  todayDone: number;
  todayWaiting: number;
  queueCurrent: { code: string; maskedName: string } | null;
  nextAppointment: { timeSlot: string; maskedName: string } | null;
  lifetime: {
    systemDone: number;
    historicalBaseline: number;
    totalDisplayed: number;
    systemSince: string | null;
  };
  monthDone: number;
  // P1
  todayNotArrived: number;
  todaySkipped: number;
  todayWalkIn: number;
  queueMode: QueueCallMode;
  queueModeLabel: string;
  nextAppointments: { id: string; timeSlot: string; maskedName: string }[];
  todaySlots: { booked: number; available: number; total: number; closed: boolean };
  tomorrow: { date: string; isOffDay: boolean; booked: number };
  weekAhead: { date: string; booked: number; isOffDay: boolean }[];
  recentDone: { queueCode?: string; maskedName: string; finishedAt: string }[];
  // P2
  todayByTreatment: { treatmentId: string; name: string; count: number }[];
  todayCancelled: number;
  todayUniquePatients: number;
  todayVisitCount: number;
  avgWaitMinutes: number | null;
  // P3
  monthCompare: {
    thisMonth: number;
    lastMonth: number;
    delta: number;
    deltaPercent: number;
  };
  wellness: { enabledCount: number; totalCount: number };
  nextOffDay: { date: string; label: string } | null;
}

function findNextOffDay(fromDate: string): { date: string; label: string } | null {
  for (let i = 1; i <= 366; i++) {
    const date = addDays(fromDate, i);
    if (isFullOffDay(date)) {
      return { date, label: offDayLabel(date) };
    }
  }
  return null;
}

function buildWellnessSummary() {
  const tips = getAllWellnessTips();
  return {
    enabledCount: tips.filter((t) => t.enabled).length,
    totalCount: tips.length,
  };
}

export function buildAdminSummary(): AdminSummaryPayload {
  const today = getClinicToday();
  const all = readAllBookings();
  const todayRecords = all.filter((b) => b.date === today);
  const todayActive = todayRecords.filter((b) => b.status !== 'cancelled');
  const board = getQueueBoard(today);
  const stats = getClinicStats();

  const todayBooked = todayActive.length;
  const todayDone = todayRecords.filter(isDoneVisit).length;
  const todayWaiting = todayRecords.filter(
    (b) => b.queueStatus && WAITING_STATUSES.has(b.queueStatus)
  ).length;

  const todayNotArrived = todayActive.filter(
    (b) => b.queueStatus === 'not_arrived' || !b.queueStatus
  ).length;
  const todaySkipped = todayRecords.filter((b) => b.queueStatus === 'skipped').length;
  const todayWalkIn = todayActive.filter((b) => b.source === 'walk_in').length;

  const nextAppointments = pickNextAppointments(todayRecords);
  const nextAppointment = nextAppointments[0]
    ? { timeSlot: nextAppointments[0].timeSlot, maskedName: nextAppointments[0].maskedName }
    : null;

  const tomorrowDate = addDays(today, 1);
  const weekAhead = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i);
    return {
      date,
      booked: countBookedOnDate(all, date),
      isOffDay: isFullOffDay(date),
    };
  });

  const phones = new Set(
    todayActive.map((b) => b.patientPhone.replace(/\s/g, ''))
  );

  const queueCurrent = board.current?.queueCode
    ? {
        code: board.current.queueCode,
        maskedName: board.current.maskedName,
      }
    : null;

  const doneVisits = all.filter(isDoneVisit);
  const systemDone = doneVisits.length;

  let systemSince: string | null = null;
  if (all.length > 0) {
    const earliest = all.reduce(
      (min, b) => (b.createdTime < min ? b.createdTime : min),
      all[0].createdTime
    );
    systemSince = earliest.slice(0, 10);
  }

  const thisMonth = monthKey(today);
  const monthDone = doneVisits.filter((b) => monthKey(b.date) === thisMonth).length;

  const queueMode = board.mode;

  return {
    today,
    isOffDay: isFullOffDay(today),
    todayBooked,
    todayDone,
    todayWaiting,
    queueCurrent,
    nextAppointment,
    lifetime: {
      systemDone,
      historicalBaseline: stats.historicalBaseline,
      totalDisplayed: systemDone + stats.historicalBaseline,
      systemSince,
    },
    monthDone,
    todayNotArrived,
    todaySkipped,
    todayWalkIn,
    queueMode,
    queueModeLabel: MODE_LABELS[queueMode] ?? queueMode,
    nextAppointments,
    todaySlots: buildTodaySlots(today),
    tomorrow: {
      date: tomorrowDate,
      isOffDay: isFullOffDay(tomorrowDate),
      booked: countBookedOnDate(all, tomorrowDate),
    },
    weekAhead,
    recentDone: buildRecentDone(all, today),
    todayByTreatment: buildTodayByTreatment(todayActive),
    todayCancelled: todayRecords.filter((b) => b.status === 'cancelled').length,
    todayUniquePatients: phones.size,
    todayVisitCount: todayBooked,
    avgWaitMinutes: computeAvgWaitMinutes(todayRecords),
    monthCompare: buildMonthCompare(),
    wellness: buildWellnessSummary(),
    nextOffDay: findNextOffDay(today),
  };
}
