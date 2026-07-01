/**
 * 总览趋势：完成就诊人次按日/月聚合
 */

import { readAllBookings, type BookingRecord } from './db.js';
import { getClinicToday } from './clinicTime.js';

export type TrendRange = '7d' | '30d' | 'month' | 'year';

function isDoneVisit(b: BookingRecord): boolean {
  return b.status !== 'cancelled' && b.queueStatus === 'done';
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days, 12, 0, 0);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function countDoneOnDate(all: BookingRecord[], date: string): number {
  return all.filter((b) => b.date === date && isDoneVisit(b)).length;
}

function shortLabel(dateStr: string): string {
  return dateStr.slice(5);
}

function monthLabel(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export interface TrendPoint {
  label: string;
  date: string;
  done: number;
}

export interface TrendPayload {
  range: TrendRange;
  points: TrendPoint[];
}

export function buildAdminTrends(range: TrendRange): TrendPayload {
  const today = getClinicToday();
  const all = readAllBookings();
  const done = all.filter(isDoneVisit);
  const points: TrendPoint[] = [];

  if (range === '7d') {
    for (let i = 6; i >= 0; i--) {
      const date = addDays(today, -i);
      points.push({
        date,
        label: i === 0 ? '今天' : shortLabel(date),
        done: countDoneOnDate(done, date),
      });
    }
  } else if (range === '30d') {
    for (let i = 29; i >= 0; i--) {
      const date = addDays(today, -i);
      points.push({
        date,
        label: shortLabel(date),
        done: countDoneOnDate(done, date),
      });
    }
  } else if (range === 'month') {
    const [y, m] = today.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (date > today) break;
      points.push({
        date,
        label: String(day),
        done: countDoneOnDate(done, date),
      });
    }
  } else {
    const year = Number(today.slice(0, 4));
    const currentMonth = Number(today.slice(5, 7));
    for (let mo = 1; mo <= 12; mo++) {
      const key = monthLabel(year, mo);
      const monthDone = done.filter((b) => b.date.startsWith(key)).length;
      if (mo > currentMonth) {
        points.push({ date: `${key}-01`, label: `${mo}月`, done: 0 });
      } else {
        points.push({ date: `${key}-01`, label: `${mo}月`, done: monthDone });
      }
    }
  }

  return { range, points };
}

export function buildMonthCompare() {
  const today = getClinicToday();
  const thisKey = today.slice(0, 7);
  const [y, m] = thisKey.split('-').map(Number);
  const lastDate = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
  const lastKey = lastDate.slice(0, 7);

  const done = readAllBookings().filter(isDoneVisit);
  const thisMonth = done.filter((b) => b.date.startsWith(thisKey)).length;
  const lastMonth = done.filter((b) => b.date.startsWith(lastKey)).length;
  const delta = thisMonth - lastMonth;
  const deltaPercent =
    lastMonth > 0 ? Math.round((delta / lastMonth) * 1000) / 10 : thisMonth > 0 ? 100 : 0;

  return { thisMonth, lastMonth, delta, deltaPercent };
}
