/**
 * 中医门诊可预约时段：10:00–14:00、15:00–19:30，每 20 分钟一格
 */

import { SLOT_INTERVAL_MIN, TCM_CONSULT_WINDOWS } from '../data';

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function generateConsultTimeSlots(): string[] {
  const slots: string[] = [];
  for (const { start, end } of TCM_CONSULT_WINDOWS) {
    let cur = toMinutes(start);
    const endMin = toMinutes(end);
    while (cur + SLOT_INTERVAL_MIN <= endMin) {
      slots.push(fromMinutes(cur));
      cur += SLOT_INTERVAL_MIN;
    }
  }
  return slots;
}
