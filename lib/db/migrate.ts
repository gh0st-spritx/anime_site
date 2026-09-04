import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { db } from './index.ts';

let done = false;

/**
 * Applies pending migrations. Safe to call repeatedly; the first call in a
 * process does the work. Production runs this at boot.
 */
export function runMigrations(): void {
  if (done) return;
  const here = dirname(fileURLToPath(import.meta.url));
  migrate(db, { migrationsFolder: join(here, '..', '..', 'drizzle') });
  done = true;
}
