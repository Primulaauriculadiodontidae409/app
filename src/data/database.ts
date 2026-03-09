import Database from 'better-sqlite3';

// Shared SQLite instance — initialized at module load.
export const db = new Database('mango.db');
