/**
 * 医馆营业时区（马来西亚 Johor）— 与 server/clinicTime.ts 逻辑一致
 */

export const CLINIC_TIMEZONE = 'Asia/Kuala_Lumpur';

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function getClinicNow(): { dateStr: string; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: CLINIC_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  const dateStr = `${get('year')}-${get('month')}-${get('day')}`;
  const minutes = Number(get('hour')) * 60 + Number(get('minute'));
  return { dateStr, minutes };
}

export function getClinicToday(): string {
  return getClinicNow().dateStr;
}

export function isSlotPast(dateStr: string, slotTime: string): boolean {
  const { dateStr: today, minutes: nowMin } = getClinicNow();
  if (dateStr !== today) return false;
  return timeToMinutes(slotTime) <= nowMin;
}

export function filterVisibleSlots<T extends { time: string }>(
  dateStr: string,
  slots: T[]
): T[] {
  return slots.filter((s) => !isSlotPast(dateStr, s.time));
}

export function addClinicDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function getClinicDatesAhead(count: number): string[] {
  const today = getClinicToday();
  return Array.from({ length: count }, (_, i) => addClinicDays(today, i));
}

export interface BookableSlot {
  time: string;
  booked: boolean;
  closed?: boolean;
}

export function dayHasBookableSlot(day: {
  date: string;
  closed?: boolean;
  slots: BookableSlot[];
}): boolean {
  if (day.closed) return false;
  const visible = filterVisibleSlots(day.date, day.slots);
  return visible.some((s) => !s.booked && !s.closed);
}

export function pickDefaultBookingDate(
  days: { date: string; closed?: boolean; slots: BookableSlot[] }[]
): string {
  const bookable = days.find((d) => dayHasBookableSlot(d));
  if (bookable) return bookable.date;
  const open = days.find((d) => !d.closed);
  return open?.date ?? days[0]?.date ?? '';
}
