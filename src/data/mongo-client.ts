import { MongoClient } from 'mongodb';

export interface QueryOptions {
  filter: Record<string, unknown>;
  sort?: Record<string, number>;
  projection?: Record<string, number>;
  limit?: number;
  skip?: number;
}

export interface QueryResult {
  documents: Record<string, unknown>[];
  totalCount: number;
  executionTimeMs: number;
}

export interface DatabaseInfo {
  name: string;
  sizeOnDisk: number;
  empty: boolean;
}

export interface CollectionInfo {
  name: string;
  type: string;
}

export interface CollectionStats {
  ns: string;
  count: number;
  size: number;
  storageSize: number;
  indexCount: number;
  totalIndexSize: number;
}

export interface IndexInfo {
  name: string;
  key: Record<string, number>;
  unique: boolean;
  sparse: boolean;
  size: number;
}

export class MangoClient {
  private client: any = null;
  private _isConnected: boolean = false;
  private _latencyMs: number = 0;

  get isConnected(): boolean {
    return this._isConnected;
  }

  get latencyMs(): number {
    return this._latencyMs;
  }

  async connect(uri: string): Promise<void> {
    const start = Date.now();
    this.client = new MongoClient(uri);
    await this.client.connect();
    this._latencyMs = Date.now() - start;
    this._isConnected = true;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this._isConnected = false;
      this._latencyMs = 0;
    }
  }

  async ping(): Promise<number> {
    this.ensureConnected();
    const start = Date.now();
    await this.client.db('admin').command({ ping: 1 });
    const latency = Date.now() - start;
    this._latencyMs = latency;
    return latency;
  }

  async listDatabases(): Promise<DatabaseInfo[]> {
    this.ensureConnected();
    const result = await this.client.db('admin').command({ listDatabases: 1 });
    return result.databases.map((db: any) => ({
      name: db.name,
      sizeOnDisk: db.sizeOnDisk,
      empty: db.empty,
    }));
  }

  async listCollections(dbName: string): Promise<CollectionInfo[]> {
    this.ensureConnected();
    const collections = await this.client.db(dbName).listCollections().toArray();
    return collections.map((c: any) => ({
      name: c.name,
      type: c.type,
    }));
  }

  async query(dbName: string, collName: string, options: QueryOptions): Promise<QueryResult> {
    this.ensureConnected();
    const start = Date.now();
    const coll = this.client.db(dbName).collection(collName);

    const totalCount = await coll.countDocuments(options.filter);

    let cursor = coll.find(options.filter);
    if (options.sort) cursor = cursor.sort(options.sort);
    if (options.projection) cursor = cursor.project(options.projection);
    if (options.skip) cursor = cursor.skip(options.skip);
    if (options.limit) cursor = cursor.limit(options.limit);

    const documents = await cursor.toArray();
    const executionTimeMs = Date.now() - start;

    return { documents, totalCount, executionTimeMs };
  }

  async insertDocument(dbName: string, collName: string, doc: Record<string, unknown>): Promise<string> {
    this.ensureConnected();
    const coll = this.client.db(dbName).collection(collName);
    const result = await coll.insertOne(doc);
    return result.insertedId.toString();
  }

  async updateDocument(dbName: string, collName: string, id: unknown, doc: Record<string, unknown>): Promise<boolean> {
    this.ensureConnected();
    const coll = this.client.db(dbName).collection(collName);
    const { _id, ...updateDoc } = doc;
    const result = await coll.replaceOne({ _id: id }, updateDoc);
    return result.modifiedCount > 0;
  }

  async deleteDocument(dbName: string, collName: string, id: unknown): Promise<boolean> {
    this.ensureConnected();
    const coll = this.client.db(dbName).collection(collName);
    const result = await coll.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  async deleteDocuments(dbName: string, collName: string, ids: unknown[]): Promise<number> {
    this.ensureConnected();
    const coll = this.client.db(dbName).collection(collName);
    const result = await coll.deleteMany({ _id: { $in: ids } });
    return result.deletedCount;
  }

  async duplicateDocument(dbName: string, collName: string, id: unknown): Promise<string> {
    this.ensureConnected();
    const coll = this.client.db(dbName).collection(collName);
    const doc = await coll.findOne({ _id: id });
    if (!doc) throw new Error('Document not found');
    const { _id, ...rest } = doc;
    const result = await coll.insertOne(rest);
    return result.insertedId.toString();
  }

  async getCollectionStats(dbName: string, collName: string): Promise<CollectionStats> {
    this.ensureConnected();
    const stats = await this.client.db(dbName).command({ collStats: collName });
    return {
      ns: stats.ns,
      count: stats.count,
      size: stats.size,
      storageSize: stats.storageSize,
      indexCount: stats.nindexes,
      totalIndexSize: stats.totalIndexSize,
    };
  }

  async listIndexes(dbName: string, collName: string): Promise<IndexInfo[]> {
    this.ensureConnected();
    const coll = this.client.db(dbName).collection(collName);
    const indexes = await coll.indexes();
    const stats = await this.client.db(dbName).command({ collStats: collName });
    const indexSizes = stats.indexSizes || {};

    return indexes.map((idx: any) => ({
      name: idx.name,
      key: idx.key,
      unique: idx.unique === true || idx.name === '_id_',
      sparse: idx.sparse === true,
      size: indexSizes[idx.name] || 0,
    }));
  }

  private ensureConnected(): void {
    if (!this.client || !this._isConnected) {
      throw new Error('Not connected to MongoDB');
    }
  }
}
