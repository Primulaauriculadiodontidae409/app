// Helper to reset the database singleton between tests.
// We reach into the database module and clear its cached instance
// so the next getDatabase() call creates a fresh in-memory SQLite.

export function resetDatabase(): void {
  // The database module caches the instance in a module-level variable.
  // We need to delete the cached require so it gets re-evaluated,
  // OR we can directly mutate the module's internal state.
  //
  // Since ES modules cache, we use a different approach:
  // We'll just drop all tables in the existing database, effectively resetting it.
  // But simpler: we import getDatabase and drop the tables.

  const { getDatabase } = require('../../src/data/database');
  const db = getDatabase();
  // Drop the tables used by our stores
  try { db.exec('DROP TABLE IF EXISTS connections'); } catch {}
  try { db.exec('DROP TABLE IF EXISTS preferences'); } catch {}
}
