import '../server/loadEnv.js';
import { initDatabase, migrateFromLegacyJson } from '../server/db/init.js';
import { resolveDbPath } from '../server/db/paths.js';

initDatabase();
const result = migrateFromLegacyJson();

console.log(`SQLite: ${resolveDbPath()}`);
console.log(
  result.imported > 0
    ? `Imported ${result.imported} booking(s) from bookings.json`
    : 'No legacy bookings to import (already migrated or empty).'
);
