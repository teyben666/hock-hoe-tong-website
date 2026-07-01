import { generateConsultTimeSlots } from '../utils/consultSlots';

export function formatDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const TODAY = formatDateLocal(new Date());

export const MAX_BOOK_DATE = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return formatDateLocal(d);
})();

export function getQuickDates(count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + i);
    return formatDateLocal(d);
  });
}

export function formatDayLabel(dateStr: string, index: number): string {
  if (dateStr === TODAY) return '今天';
  const tomorrow = getQuickDates(2)[1];
  if (dateStr === tomorrow) return '明天';
  const d = new Date(dateStr + 'T12:00:00');
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return `周${weekdays[d.getDay()]} ${dateStr.slice(5)}`;
}

/** 与后端一致的 20 分钟门诊时段列表 */
export function generateAdminTimeSlots(): string[] {
  return generateConsultTimeSlots();
}
