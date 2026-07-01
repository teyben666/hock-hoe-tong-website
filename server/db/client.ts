import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';
import { DATA_DIR, resolveDbPath } from './paths.js';

let sqlite: DatabaseSync | null = null;

export function getSqlite(): DatabaseSync {
  if (!sqlite) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    sqlite = new DatabaseSync(resolveDbPath());
    sqlite.exec('PRAGMA journal_mode = WAL;');
    sqlite.exec('PRAGMA foreign_keys = ON;');
    sqlite.exec('PRAGMA busy_timeout = 5000;');
  }
  return sqlite;
}

export function withTransaction<T>(fn: () => T): T {
  const conn = getSqlite();
  conn.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    conn.exec('COMMIT');
    return result;
  } catch (error) {
    conn.exec('ROLLBACK');
    throw error;
  }
}

export type BookingRow = {
  id: string;
  patient_id: string | null;
  patient_name: string;
  patient_phone: string;
  gender: string;
  birth_date: string;
  visitor_count: number;
  doctor_id: string;
  treatment_id: string;
  date: string;
  time_slot: string;
  symptoms: string | null;
  wechat_notify: number;
  wechat_id: string | null;
  status: string;
  source: string | null;
  queue_code: string | null;
  queue_seq: number | null;
  queue_status: string | null;
  queue_priority: number;
  checked_in_at: string | null;
  called_at: string | null;
  recall_count: number;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
};

export type PatientRow = {
  id: string;
  phone: string;
  name: string;
  gender: string;
  birth_date: string;
  wechat_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
