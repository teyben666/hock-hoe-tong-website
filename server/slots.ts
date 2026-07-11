/**
 * Generate 20-minute TCM consult slots (10:00–19:30 continuous).
 * Irregular lunch breaks are closed via admin「时段休息」partial blocks.
 */

import { getBookingsByDate } from './db.js';
import { isFullOffDay, isSlotClosed, hasPartialClosure } from './scheduleConfig.js';
import { isSlotPast } from './clinicTime.js';

const TCM_WINDOWS = [
  { start: '10:00', end: '19:30' },
] as const;
const INTERVAL = 20;

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (const { start, end } of TCM_WINDOWS) {
    let cur = toMinutes(start);
    const endMin = toMinutes(end);
    while (cur + INTERVAL <= endMin) {
      const h = Math.floor(cur / 60);
      const m = cur % 60;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      cur += INTERVAL;
    }
  }
  return slots;
}

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getNextDays(count: number): string[] {
  const days: string[] = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(formatDate(d));
  }
  return days;
}

export function getAvailabilityForDate(
  date: string,
  opts?: { hidePast?: boolean }
) {
  const closed = isFullOffDay(date);
  const booked = new Set(getBookingsByDate(date).map((b) => b.timeSlot));
  const allSlots = generateTimeSlots();
  let slots = allSlots.map((time) => ({
    time,
    booked: closed ? false : booked.has(time),
    closed: closed || isSlotClosed(date, time),
  }));

  if (opts?.hidePast) {
    slots = slots.filter((s) => !isSlotPast(date, s.time));
  }

  return {
    date,
    closed,
    partialClosed: !closed && hasPartialClosure(date),
    slots,
  };
}

/** 官网预约：隐藏今日已过时段时间 */
export function getPublicAvailabilityForDate(date: string) {
  return getAvailabilityForDate(date, { hidePast: true });
}

export function getPublicAvailabilityRange(daysAhead: number) {
  return getNextDays(daysAhead).map((date) => getPublicAvailabilityForDate(date));
}

export function getAvailabilityRange(daysAhead: number) {
  return getNextDays(daysAhead).map((date) => getAvailabilityForDate(date));
}
