// Mock for 'perry/sqlite' using Bun's built-in SQLite
import { Database } from 'bun:sqlite';

export class SQLite {
  private db: Database;

  constructor(_filename: string) {
    // Always use in-memory database for tests
    this.db = new Database(':memory:');
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  query(sql: string, params?: unknown[]): Record<string, unknown>[] {
    const stmt = this.db.prepare(sql);
    if (params && params.length > 0) {
      return stmt.all(...params) as Record<string, unknown>[];
    }
    return stmt.all() as Record<string, unknown>[];
  }

  run(sql: string, params?: unknown[]): { changes: number } {
    const stmt = this.db.prepare(sql);
    let result;
    if (params && params.length > 0) {
      result = stmt.run(...params);
    } else {
      result = stmt.run();
    }
    return { changes: result.changes };
  }

  close(): void {
    this.db.close();
  }
}
