/**
 * 预约日期标签（中英）
 */

import { BOOKING_COPY } from '../data';

const WEEKDAYS_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] as const;
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function getDayLabelBilingual(
  dateStr: string,
  index: number
): { zh: string; en: string } {
  const ui = BOOKING_COPY.ui;
  if (index === 0) return { zh: ui.todayZh, en: ui.todayEn };
  if (index === 1) return { zh: ui.tomorrowZh, en: ui.tomorrowEn };

  const d = new Date(`${dateStr}T12:00:00`);
  const mmdd = dateStr.slice(5);
  const wd = d.getDay();
  return {
    zh: `${WEEKDAYS_ZH[wd]} ${mmdd}`,
    en: `${WEEKDAYS_EN[wd]} ${mmdd}`,
  };
}
