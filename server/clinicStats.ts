/**
 * 诊所累计统计基数（系统上线前历史人次，可后台编辑）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const STATS_FILE = path.join(DATA_DIR, 'clinic-stats.json');

export interface ClinicStats {
  historicalBaseline: number;
  updatedAt: string;
}

const DEFAULT_STATS: ClinicStats = {
  historicalBaseline: 0,
  updatedAt: new Date().toISOString(),
};

function ensureStatsFile(): ClinicStats {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STATS_FILE)) {
    fs.writeFileSync(STATS_FILE, JSON.stringify(DEFAULT_STATS, null, 2), 'utf-8');
    return { ...DEFAULT_STATS };
  }
  const raw = fs.readFileSync(STATS_FILE, 'utf-8');
  try {
    const parsed = JSON.parse(raw) as Partial<ClinicStats>;
    return {
      historicalBaseline: Math.max(0, Number(parsed.historicalBaseline) || 0),
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

function writeStats(stats: ClinicStats): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8');
}

export function getClinicStats(): ClinicStats {
  return ensureStatsFile();
}

export function setHistoricalBaseline(value: number): ClinicStats {
  const n = Math.max(0, Math.floor(Number(value)));
  if (!Number.isFinite(n)) {
    throw new Error('INVALID_BASELINE');
  }
  const stats: ClinicStats = {
    historicalBaseline: n,
    updatedAt: new Date().toISOString(),
  };
  writeStats(stats);
  return stats;
}
