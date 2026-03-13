import Database from 'better-sqlite3';

let instance: Database | null = null;

/** Return the shared SQLite instance, creating it on first call. */
export function getDatabase(): Database {
  if (!instance) {
    instance = new Database('mango.db');
  }
  return instance;
}
