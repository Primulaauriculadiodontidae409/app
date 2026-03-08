import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { MangoClient } from '../src/data/mongo-client';

// These tests require a running MongoDB instance at localhost:27017.
// If MongoDB is not reachable, all tests in this file are skipped.

async function isMongoRunning(): Promise<boolean> {
  try {
    const socket = await Bun.connect({
      hostname: 'localhost',
      port: 27017,
      socket: {
        data() {},
        open(socket) { socket.end(); },
        error() {},
        close() {},
      },
    });
    socket.end();
    return true;
  } catch {
    return false;
  }
}

const mongoAvailable = await isMongoRunning();

describe.if(mongoAvailable)('MangoClient', () => {
  let client: MangoClient;
  const TEST_DB = 'mango_test';
  const TEST_COLL = 'test_collection';

  beforeAll(async () => {
    client = new MangoClient();
    await client.connect('mongodb://localhost:27017');
  });

  afterAll(async () => {
    // Clean up test database
    if (client.isConnected) {
      await client.disconnect();
    }
  });

  describe('connection', () => {
    it('should report connected after connect', () => {
      expect(client.isConnected).toBe(true);
    });

    it('should have a positive latency', () => {
      expect(client.latencyMs).toBeGreaterThan(0);
    });

    it('should ping successfully', async () => {
      const latency = await client.ping();
      expect(latency).toBeGreaterThan(0);
    });
  });

  describe('listDatabases', () => {
    it('should return an array of databases', async () => {
      const dbs = await client.listDatabases();
      expect(Array.isArray(dbs)).toBe(true);
      // Should at least have admin, config, local
      const names = dbs.map((db) => db.name);
      expect(names).toContain('admin');
    });

    it('should include size information', async () => {
      const dbs = await client.listDatabases();
      for (const db of dbs) {
        expect(typeof db.name).toBe('string');
        expect(typeof db.sizeOnDisk).toBe('number');
        expect(typeof db.empty).toBe('boolean');
      }
    });
  });

  describe('listCollections', () => {
    it('should return an array', async () => {
      const collections = await client.listCollections('admin');
      expect(Array.isArray(collections)).toBe(true);
    });

    it('should include collection type', async () => {
      // Insert a doc to ensure the test collection exists
      await client.insertDocument(TEST_DB, TEST_COLL, { _setup: true });

      const collections = await client.listCollections(TEST_DB);
      expect(collections.length).toBeGreaterThan(0);

      const testColl = collections.find((c) => c.name === TEST_COLL);
      expect(testColl).toBeDefined();
      expect(testColl!.type).toBe('collection');

      // Cleanup
      await client.deleteDocument(TEST_DB, TEST_COLL, (await client.query(TEST_DB, TEST_COLL, { filter: { _setup: true } })).documents[0]._id);
    });
  });

  describe('CRUD operations', () => {
    it('should insert a document and return its ID', async () => {
      const id = await client.insertDocument(TEST_DB, TEST_COLL, {
        name: 'Alice',
        age: 30,
      });
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should query documents with filter', async () => {
      // Insert test data
      await client.insertDocument(TEST_DB, TEST_COLL, { name: 'Bob', age: 25, _test: 'query' });
      await client.insertDocument(TEST_DB, TEST_COLL, { name: 'Charlie', age: 35, _test: 'query' });

      const result = await client.query(TEST_DB, TEST_COLL, {
        filter: { _test: 'query', age: { $gt: 28 } },
      });

      expect(result.documents.length).toBe(1);
      expect(result.documents[0].name).toBe('Charlie');
      expect(result.totalCount).toBe(1);
      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should query with sort', async () => {
      await client.insertDocument(TEST_DB, TEST_COLL, { name: 'Zara', order: 2, _test: 'sort' });
      await client.insertDocument(TEST_DB, TEST_COLL, { name: 'Amy', order: 1, _test: 'sort' });

      const result = await client.query(TEST_DB, TEST_COLL, {
        filter: { _test: 'sort' },
        sort: { order: 1 },
      });

      expect(result.documents[0].name).toBe('Amy');
      expect(result.documents[1].name).toBe('Zara');
    });

    it('should query with projection', async () => {
      await client.insertDocument(TEST_DB, TEST_COLL, { name: 'Proj', age: 20, secret: 'hidden', _test: 'proj' });

      const result = await client.query(TEST_DB, TEST_COLL, {
        filter: { _test: 'proj' },
        projection: { name: 1, age: 1 },
      });

      expect(result.documents[0].name).toBe('Proj');
      expect(result.documents[0].age).toBe(20);
      expect(result.documents[0].secret).toBeUndefined();
    });

    it('should query with limit', async () => {
      for (let i = 0; i < 5; i++) {
        await client.insertDocument(TEST_DB, TEST_COLL, { _test: 'limit', i });
      }

      const result = await client.query(TEST_DB, TEST_COLL, {
        filter: { _test: 'limit' },
        limit: 3,
      });

      expect(result.documents.length).toBe(3);
      expect(result.totalCount).toBe(5);
    });

    it('should query with skip for pagination', async () => {
      for (let i = 0; i < 5; i++) {
        await client.insertDocument(TEST_DB, TEST_COLL, { _test: 'skip', i });
      }

      const result = await client.query(TEST_DB, TEST_COLL, {
        filter: { _test: 'skip' },
        sort: { i: 1 },
        skip: 2,
        limit: 2,
      });

      expect(result.documents.length).toBe(2);
      expect(result.documents[0].i).toBe(2);
      expect(result.documents[1].i).toBe(3);
    });

    it('should update a document', async () => {
      const id = await client.insertDocument(TEST_DB, TEST_COLL, {
        name: 'Update Me',
        age: 20,
        _test: 'update',
      });

      const result = await client.query(TEST_DB, TEST_COLL, { filter: { _test: 'update' } });
      const doc = result.documents[0];

      const updated = await client.updateDocument(TEST_DB, TEST_COLL, doc._id, {
        name: 'Updated',
        age: 21,
        _test: 'update',
      });

      expect(updated).toBe(true);

      const check = await client.query(TEST_DB, TEST_COLL, { filter: { _test: 'update' } });
      expect(check.documents[0].name).toBe('Updated');
      expect(check.documents[0].age).toBe(21);
    });

    it('should delete a single document', async () => {
      const id = await client.insertDocument(TEST_DB, TEST_COLL, {
        name: 'Delete Me',
        _test: 'delete_single',
      });

      const result = await client.query(TEST_DB, TEST_COLL, { filter: { _test: 'delete_single' } });
      const deleted = await client.deleteDocument(TEST_DB, TEST_COLL, result.documents[0]._id);

      expect(deleted).toBe(true);

      const check = await client.query(TEST_DB, TEST_COLL, { filter: { _test: 'delete_single' } });
      expect(check.totalCount).toBe(0);
    });

    it('should delete multiple documents', async () => {
      const ids: unknown[] = [];
      for (let i = 0; i < 3; i++) {
        await client.insertDocument(TEST_DB, TEST_COLL, { _test: 'delete_multi', i });
      }

      const result = await client.query(TEST_DB, TEST_COLL, { filter: { _test: 'delete_multi' } });
      const docIds = result.documents.map((d) => d._id);

      const count = await client.deleteDocuments(TEST_DB, TEST_COLL, docIds);
      expect(count).toBe(3);

      const check = await client.query(TEST_DB, TEST_COLL, { filter: { _test: 'delete_multi' } });
      expect(check.totalCount).toBe(0);
    });

    it('should duplicate a document', async () => {
      await client.insertDocument(TEST_DB, TEST_COLL, {
        name: 'Original',
        value: 42,
        _test: 'duplicate',
      });

      const result = await client.query(TEST_DB, TEST_COLL, { filter: { _test: 'duplicate' } });
      const originalId = result.documents[0]._id;

      const newId = await client.duplicateDocument(TEST_DB, TEST_COLL, originalId);
      expect(newId).toBeDefined();
      expect(newId).not.toBe(String(originalId));

      const check = await client.query(TEST_DB, TEST_COLL, { filter: { _test: 'duplicate' } });
      expect(check.totalCount).toBe(2);
      expect(check.documents[0].name).toBe('Original');
      expect(check.documents[1].name).toBe('Original');
    });

    it('should throw when duplicating nonexistent document', async () => {
      await expect(
        client.duplicateDocument(TEST_DB, TEST_COLL, 'nonexistent_id')
      ).rejects.toThrow('Document not found');
    });
  });

  describe('getCollectionStats', () => {
    it('should return collection statistics', async () => {
      // Ensure collection has data
      await client.insertDocument(TEST_DB, TEST_COLL, { _test: 'stats' });

      const stats = await client.getCollectionStats(TEST_DB, TEST_COLL);

      expect(stats.ns).toContain(TEST_COLL);
      expect(stats.count).toBeGreaterThan(0);
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.storageSize).toBe('number');
      expect(typeof stats.indexCount).toBe('number');
      expect(stats.indexCount).toBeGreaterThanOrEqual(1); // at least _id index
      expect(typeof stats.totalIndexSize).toBe('number');
    });
  });

  describe('listIndexes', () => {
    it('should always include the _id index', async () => {
      // Ensure collection exists
      await client.insertDocument(TEST_DB, TEST_COLL, { _test: 'indexes' });

      const indexes = await client.listIndexes(TEST_DB, TEST_COLL);

      expect(indexes.length).toBeGreaterThanOrEqual(1);

      const idIndex = indexes.find((idx) => idx.name === '_id_');
      expect(idIndex).toBeDefined();
      expect(idIndex!.key).toEqual({ _id: 1 });
      expect(idIndex!.unique).toBe(true);
    });

    it('should return proper index metadata', async () => {
      const indexes = await client.listIndexes(TEST_DB, TEST_COLL);

      for (const idx of indexes) {
        expect(typeof idx.name).toBe('string');
        expect(typeof idx.key).toBe('object');
        expect(typeof idx.unique).toBe('boolean');
        expect(typeof idx.sparse).toBe('boolean');
        expect(typeof idx.size).toBe('number');
      }
    });
  });

  describe('disconnect', () => {
    it('should disconnect cleanly', async () => {
      const tempClient = new MangoClient();
      await tempClient.connect('mongodb://localhost:27017');
      expect(tempClient.isConnected).toBe(true);

      await tempClient.disconnect();
      expect(tempClient.isConnected).toBe(false);
      expect(tempClient.latencyMs).toBe(0);
    });

    it('should be safe to call disconnect when not connected', async () => {
      const tempClient = new MangoClient();
      // Should not throw
      await tempClient.disconnect();
    });
  });

  describe('error handling', () => {
    it('should throw when querying without connection', async () => {
      const tempClient = new MangoClient();

      await expect(
        tempClient.listDatabases()
      ).rejects.toThrow('Not connected');
    });

    it('should return empty results for empty filter on empty collection', async () => {
      const result = await client.query(TEST_DB, 'nonexistent_empty_coll', {
        filter: {},
      });

      expect(result.documents).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });
});
