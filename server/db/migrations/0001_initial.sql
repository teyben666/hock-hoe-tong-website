-- Phase 1: patients + bookings (idempotent)

CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  gender TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  wechat_id TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY NOT NULL,
  patient_id TEXT REFERENCES patients(id),
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  gender TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  visitor_count INTEGER NOT NULL DEFAULT 1,
  doctor_id TEXT NOT NULL,
  treatment_id TEXT NOT NULL,
  date TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  symptoms TEXT,
  wechat_notify INTEGER NOT NULL DEFAULT 0,
  wechat_id TEXT,
  status TEXT NOT NULL,
  source TEXT,
  queue_code TEXT,
  queue_seq INTEGER,
  queue_status TEXT,
  queue_priority INTEGER NOT NULL DEFAULT 0,
  checked_in_at TEXT,
  called_at TEXT,
  recall_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  cancelled_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(patient_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_queue ON bookings(date, queue_status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_slot_unique
  ON bookings(date, time_slot)
  WHERE source != 'walk_in' AND status != 'cancelled' AND time_slot != 'walk-in';

CREATE TABLE IF NOT EXISTS schema_meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
