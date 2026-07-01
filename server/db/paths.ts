import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DATA_DIR = path.join(__dirname, '..', 'data');

export function resolveDbPath(): string {
  const fromEnv = process.env.DB_PATH?.trim();
  if (fromEnv) {
    return path.isAbsolute(fromEnv) ? fromEnv : path.resolve(process.cwd(), fromEnv);
  }
  return path.join(DATA_DIR, 'clinic.db');
}

export const LEGACY_BOOKINGS_JSON = path.join(DATA_DIR, 'bookings.json');
export const LEGACY_BOOKINGS_BACKUP = path.join(DATA_DIR, 'bookings.json.bak');
