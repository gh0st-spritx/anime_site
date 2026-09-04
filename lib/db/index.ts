import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import * as schema from './schema.ts';

/**
 * All persistent state lives here, never in the repo directory — production
 * mounts a volume at DATA_DIR and the build is otherwise read-only.
 */
export const DATA_DIR = resolve(process.env.DATA_DIR ?? './data');
export const UPLOADS_DIR = join(DATA_DIR, 'uploads');

mkdirSync(UPLOADS_DIR, { recursive: true });

const sqlite = new Database(join(DATA_DIR, 'portfolio.db'));
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
export { sqlite };
