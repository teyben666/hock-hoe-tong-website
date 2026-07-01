import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSqlite } from './client.js';
import {
  DATA_DIR,
  LEGACY_BOOKINGS_BACKUP,
  LEGACY_BOOKINGS_JSON,
} from './paths.js';
import type { BookingRecord } from './types.js';
import { importBookingRecords } from './bookingRepo.js';

const MIGRATION_SQL = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'migrations',
  '0001_initial.sql'
);

const META_JSON_MIGRATED = 'json_bookings_migrated';

let initialized = false;

function runSchemaMigrations(): void {
  const sql = fs.readFileSync(MIGRATION_SQL, 'utf-8');
  getSqlite().exec(sql);
}

function getMeta(key: string): string | null {
  const row = getSqlite()
    .prepare('SELECT value FROM schema_meta WHERE key = ?')
    .get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

function setMeta(key: string, value: string): void {
  getSqlite()
    .prepare(
      `INSERT INTO schema_meta (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
    .run(key, value);
}

function readLegacyBookingsJson(): BookingRecord[] {
  if (!fs.existsSync(LEGACY_BOOKINGS_JSON)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(LEGACY_BOOKINGS_JSON, 'utf-8'));
    return Array.isArray(parsed) ? (parsed as BookingRecord[]) : [];
  } catch {
    return [];
  }
}

function backupLegacyJson(): void {
  if (!fs.existsSync(LEGACY_BOOKINGS_JSON)) return;
  if (fs.existsSync(LEGACY_BOOKINGS_BACKUP)) return;
  fs.copyFileSync(LEGACY_BOOKINGS_JSON, LEGACY_BOOKINGS_BACKUP);
}

export function migrateFromLegacyJson(): { imported: number } {
  const legacy = readLegacyBookingsJson();
  if (legacy.length === 0) {
    setMeta(META_JSON_MIGRATED, new Date().toISOString());
    return { imported: 0 };
  }

  const imported = importBookingRecords(legacy);
  backupLegacyJson();
  fs.writeFileSync(LEGACY_BOOKINGS_JSON, '[]\n', 'utf-8');
  setMeta(META_JSON_MIGRATED, new Date().toISOString());
  return { imported };
}

export function initDatabase(): void {
  if (initialized) return;
  initialized = true;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  runSchemaMigrations();

  const migratedFlag = getMeta(META_JSON_MIGRATED);
  const countRow = getSqlite()
    .prepare('SELECT COUNT(*) AS total FROM bookings')
    .get() as { total: number };
  const bookingCount = countRow?.total ?? 0;

  if (!migratedFlag && bookingCount === 0) {
    const { imported } = migrateFromLegacyJson();
    if (imported > 0) {
      console.log(`[db] 已从 bookings.json 导入 ${imported} 条预约到 SQLite`);
    }
  }
}
