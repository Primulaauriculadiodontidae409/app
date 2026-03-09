import Database from 'better-sqlite3';

let instance: any = null;

/** Return the shared SQLite instance, creating it on first call. */
export function getDatabase(): any {
  if (!instance) {
    instance = new Database('mango.db');
  }
  return instance;
}
