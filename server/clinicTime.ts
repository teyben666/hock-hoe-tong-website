/**
 * 医馆营业时区（马来西亚 Johor）
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

/** 时段起点已过或等于当前时刻（如 20:22 隐藏 20:00，保留 20:30） */
export function isSlotPast(dateStr: string, slotTime: string): boolean {
  const { dateStr: today, minutes: nowMin } = getClinicNow();
  if (dateStr !== today) return false;
  return timeToMinutes(slotTime) <= nowMin;
}
