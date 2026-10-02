import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

// All database access goes through this module (see CLAUDE.md, Conventions).
export function openDb(file = process.env.DATABASE_FILE ?? 'data/app.db') {
  return drizzle(new Database(file), { schema });
}
