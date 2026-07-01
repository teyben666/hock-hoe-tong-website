/**
 * 营业 / 休息配置（JSON 持久化，Admin 可改）
 * 支持：每周固定休息日、指定全天休息、时段休息（几小时）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import './loadEnv.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'schedule.json');

export interface TimeBlock {
  id: string;
  /** 每周几重复（0=周日 … 6=周六） */
  weekday?: number;
  /** 仅该日 YYYY-MM-DD */
  date?: string;
  start: string;
  end: string;
  note?: string;
}

export interface ScheduleConfig {
  weekdays: number[];
  dates: string[];
  blocks: TimeBlock[];
}

const DEFAULT_CONFIG: ScheduleConfig = {
  weekdays: [],
  dates: [],
  blocks: [],
};

function ensureConfigFile(): ScheduleConfig {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(CONFIG_FILE)) {
    const migrated = migrateFromEnv();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(migrated, null, 2), 'utf-8');
    return migrated;
  }
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as ScheduleConfig;
    return normalizeConfig(parsed);
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function migrateFromEnv(): ScheduleConfig {
  const weekdays: number[] = [];
  const dates: string[] = [];
  const rawW = process.env.OFF_WEEKDAYS?.trim();
  if (rawW) {
    rawW.split(',').forEach((s) => {
      const n = Number(s.trim());
      if (n >= 0 && n <= 6) weekdays.push(n);
    });
  }
  const rawD = process.env.OFF_DATES?.trim();
  if (rawD) {
    rawD.split(',').forEach((s) => {
      const d = s.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) dates.push(d);
    });
  }
  return { weekdays, dates, blocks: [] };
}

function normalizeConfig(input: Partial<ScheduleConfig>): ScheduleConfig {
  const weekdays = (input.weekdays ?? [])
    .map((n) => Number(n))
    .filter((n) => n >= 0 && n <= 6);
  const dates = (input.dates ?? []).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
  const blocks = (input.blocks ?? [])
    .map((b) => ({
      id: b.id || `blk_${Date.now()}`,
      weekday: b.weekday !== undefined ? Number(b.weekday) : undefined,
      date: b.date,
      start: b.start,
      end: b.end,
      note: b.note,
    }))
    .filter((b) => validateBlockShape(b));
  return { weekdays: [...new Set(weekdays)], dates: [...new Set(dates)], blocks };
}

function validateBlockShape(b: TimeBlock): boolean {
  if (!/^\d{2}:\d{2}$/.test(b.start) || !/^\d{2}:\d{2}$/.test(b.end)) return false;
  if (timeToMinutes(b.start) >= timeToMinutes(b.end)) return false;
  const hasWeekday = b.weekday !== undefined && b.weekday >= 0 && b.weekday <= 6;
  const hasDate = b.date !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(b.date);
  return (hasWeekday && !hasDate) || (hasDate && !hasWeekday);
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function isTimeInRange(slotTime: string, start: string, end: string): boolean {
  const t = timeToMinutes(slotTime);
  return t >= timeToMinutes(start) && t < timeToMinutes(end);
}

export function getScheduleConfig(): ScheduleConfig {
  return ensureConfigFile();
}

export function saveScheduleConfig(config: ScheduleConfig): ScheduleConfig {
  const normalized = normalizeConfig(config);
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(normalized, null, 2), 'utf-8');
  return normalized;
}

export function validateScheduleInput(config: ScheduleConfig): string | null {
  for (const b of config.blocks) {
    if (!validateBlockShape(b)) {
      return '时段休息格式不正确：需选择「每周几」或「指定日期」，且开始时间早于结束时间';
    }
    if (timeToMinutes(b.start) < 9 * 60 || timeToMinutes(b.end) > 20 * 60) {
      return '休息时段须在 09:00–20:00 营业范围内';
    }
  }
  return null;
}

export function isFullOffDay(dateStr: string): boolean {
  const cfg = getScheduleConfig();
  if (cfg.dates.includes(dateStr)) return true;
  const d = new Date(dateStr + 'T12:00:00');
  return cfg.weekdays.includes(d.getDay());
}

function blocksForDate(dateStr: string): TimeBlock[] {
  const cfg = getScheduleConfig();
  const weekday = new Date(dateStr + 'T12:00:00').getDay();
  return cfg.blocks.filter(
    (b) =>
      (b.date !== undefined && b.date === dateStr) ||
      (b.weekday !== undefined && b.weekday === weekday)
  );
}

export function isSlotClosed(dateStr: string, slotTime: string): boolean {
  if (isFullOffDay(dateStr)) return true;
  return blocksForDate(dateStr).some((b) => isTimeInRange(slotTime, b.start, b.end));
}

/** @deprecated 使用 isFullOffDay */
export function isOffDay(dateStr: string): boolean {
  return isFullOffDay(dateStr);
}

export function getOffWeekdays(): number[] {
  return getScheduleConfig().weekdays;
}

export function getOffDates(): string[] {
  return getScheduleConfig().dates;
}

export function offDayLabel(dateStr: string): string {
  const cfg = getScheduleConfig();
  if (cfg.dates.includes(dateStr)) return '指定休息日';
  const d = new Date(dateStr + 'T12:00:00');
  const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  if (cfg.weekdays.includes(d.getDay())) {
    return `每${names[d.getDay()]}休息`;
  }
  return '休息日';
}

export function hasPartialClosure(dateStr: string): boolean {
  if (isFullOffDay(dateStr)) return false;
  const cfg = getScheduleConfig();
  const weekday = new Date(dateStr + 'T12:00:00').getDay();
  return cfg.blocks.some(
    (b) => (b.date === dateStr) || (b.weekday === weekday)
  );
}
