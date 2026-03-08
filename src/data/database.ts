import Database from 'better-sqlite3';

// Shared SQLite instance — both ConnectionStore and PreferencesStore
// use the same database file to avoid multiple handles.
let instance: any = null;

export function getDatabase(): any {
  if (!instance) {
    instance = new Database('mango.db');
  }
  return instance;
}
