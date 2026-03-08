// Stub for 'mongodb' — provides a MongoClient class that throws
// a descriptive error if actually used without the real driver installed.
// The integration test (mongo-client.test.ts) checks connectivity first
// and skips if MongoDB is unavailable.

export class MongoClient {
  constructor(_uri: string) {
    throw new Error(
      'mongodb driver is not installed. Install it with: bun add mongodb'
    );
  }

  async connect(): Promise<void> {
    throw new Error('mongodb driver is not installed.');
  }

  async close(): Promise<void> {}

  db(_name: string): any {
    throw new Error('mongodb driver is not installed.');
  }
}
