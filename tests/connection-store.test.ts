import { describe, it, expect, beforeEach } from 'bun:test';
import { resetDatabase } from './mocks/reset-database';
import { ConnectionStore, ConnectionProfile } from '../src/data/connection-store';

describe('ConnectionStore', () => {
  let store: ConnectionStore;

  beforeEach(() => {
    resetDatabase();
    store = new ConnectionStore();
  });

  describe('create', () => {
    it('should create a connection with defaults', () => {
      const profile = store.create({ name: 'Test' });

      expect(profile.name).toBe('Test');
      expect(profile.host).toBe('localhost');
      expect(profile.port).toBe(27017);
      expect(profile.authEnabled).toBe(false);
      expect(profile.authMechanism).toBe('SCRAM-SHA-256');
      expect(profile.tlsEnabled).toBe(false);
      expect(profile.color).toBe('#FF9F1C');
      expect(profile.id).toBeDefined();
      expect(profile.id.length).toBe(16);
      expect(profile.createdAt).toBeGreaterThan(0);
      expect(profile.updatedAt).toBe(profile.createdAt);
    });

    it('should create a connection with custom fields', () => {
      const profile = store.create({
        name: 'Production',
        host: 'mongo.example.com',
        port: 27018,
        authEnabled: true,
        username: 'admin',
        password: 'secret',
        authDatabase: 'admin',
        authMechanism: 'SCRAM-SHA-1',
        tlsEnabled: true,
        tlsCaFile: '/path/to/ca.pem',
      });

      expect(profile.name).toBe('Production');
      expect(profile.host).toBe('mongo.example.com');
      expect(profile.port).toBe(27018);
      expect(profile.authEnabled).toBe(true);
      expect(profile.username).toBe('admin');
      expect(profile.password).toBe('secret');
      expect(profile.authMechanism).toBe('SCRAM-SHA-1');
      expect(profile.tlsEnabled).toBe(true);
      expect(profile.tlsCaFile).toBe('/path/to/ca.pem');
    });

    it('should generate unique IDs', () => {
      const p1 = store.create({ name: 'First' });
      const p2 = store.create({ name: 'Second' });

      expect(p1.id).not.toBe(p2.id);
    });
  });

  describe('getAll', () => {
    it('should return empty array when no connections', () => {
      expect(store.getAll()).toEqual([]);
    });

    it('should return connections sorted by updatedAt desc', async () => {
      const p1 = store.create({ name: 'First' });
      const p2 = store.create({ name: 'Second' });
      // Ensure Date.now() advances so the update gets a later timestamp
      await Bun.sleep(2);
      // Update p1 to make it most recent
      store.update(p1.id, { name: 'First Updated' });

      const all = store.getAll();
      expect(all.length).toBe(2);
      expect(all[0].name).toBe('First Updated');
      expect(all[1].name).toBe('Second');
    });
  });

  describe('getById', () => {
    it('should return null for nonexistent ID', () => {
      expect(store.getById('nonexistent')).toBeNull();
    });

    it('should return the correct profile', () => {
      const created = store.create({ name: 'Test' });
      const fetched = store.getById(created.id);

      expect(fetched).not.toBeNull();
      expect(fetched!.name).toBe('Test');
      expect(fetched!.id).toBe(created.id);
    });
  });

  describe('update', () => {
    it('should return null for nonexistent ID', () => {
      expect(store.update('nonexistent', { name: 'X' })).toBeNull();
    });

    it('should update specified fields only', async () => {
      const created = store.create({
        name: 'Original',
        host: 'localhost',
        port: 27017,
      });

      // Ensure Date.now() advances so updatedAt > createdAt
      await Bun.sleep(2);

      const updated = store.update(created.id, { name: 'Updated', port: 27018 });

      expect(updated).not.toBeNull();
      expect(updated!.name).toBe('Updated');
      expect(updated!.port).toBe(27018);
      expect(updated!.host).toBe('localhost'); // unchanged
      expect(updated!.updatedAt).toBeGreaterThan(created.updatedAt);
    });

    it('should persist updates to database', () => {
      const created = store.create({ name: 'Original' });
      store.update(created.id, { name: 'Updated' });

      const fetched = store.getById(created.id);
      expect(fetched!.name).toBe('Updated');
    });
  });

  describe('delete', () => {
    it('should return false for nonexistent ID', () => {
      expect(store.delete('nonexistent')).toBe(false);
    });

    it('should delete and return true', () => {
      const created = store.create({ name: 'ToDelete' });
      expect(store.delete(created.id)).toBe(true);
      expect(store.getById(created.id)).toBeNull();
    });

    it('should not affect other connections', () => {
      const p1 = store.create({ name: 'Keep' });
      const p2 = store.create({ name: 'Delete' });
      store.delete(p2.id);

      expect(store.getAll().length).toBe(1);
      expect(store.getById(p1.id)).not.toBeNull();
    });
  });

  describe('duplicate', () => {
    it('should return null for nonexistent ID', () => {
      expect(store.duplicate('nonexistent')).toBeNull();
    });

    it('should create a copy with "(copy)" suffix', () => {
      const original = store.create({
        name: 'My Server',
        host: 'db.example.com',
        port: 27018,
        authEnabled: true,
        username: 'admin',
      });

      const copy = store.duplicate(original.id);

      expect(copy).not.toBeNull();
      expect(copy!.name).toBe('My Server (copy)');
      expect(copy!.host).toBe('db.example.com');
      expect(copy!.port).toBe(27018);
      expect(copy!.authEnabled).toBe(true);
      expect(copy!.username).toBe('admin');
      expect(copy!.id).not.toBe(original.id);
    });
  });

  describe('buildConnectionUri', () => {
    it('should build basic URI without auth', () => {
      const profile = store.create({ name: 'Test', host: 'localhost', port: 27017 });
      const uri = store.buildConnectionUri(profile);

      expect(uri).toBe('mongodb://localhost:27017');
    });

    it('should include auth credentials', () => {
      const profile = store.create({
        name: 'Auth',
        host: 'db.example.com',
        port: 27017,
        authEnabled: true,
        username: 'user',
        password: 'pass',
        authDatabase: 'admin',
        authMechanism: 'SCRAM-SHA-256',
      });
      const uri = store.buildConnectionUri(profile);

      expect(uri).toBe('mongodb://user:pass@db.example.com:27017/admin?authMechanism=SCRAM-SHA-256');
    });

    it('should encode special characters in credentials', () => {
      const profile = store.create({
        name: 'Special',
        authEnabled: true,
        username: 'user@domain',
        password: 'p@ss:word/test',
        authDatabase: 'admin',
      });
      const uri = store.buildConnectionUri(profile);

      expect(uri).toContain('user%40domain');
      expect(uri).toContain('p%40ss%3Aword%2Ftest');
    });

    it('should include TLS params', () => {
      const profile = store.create({
        name: 'TLS',
        host: 'db.example.com',
        tlsEnabled: true,
        tlsCaFile: '/path/to/ca.pem',
      });
      const uri = store.buildConnectionUri(profile);

      expect(uri).toContain('tls=true');
      expect(uri).toContain('tlsCAFile=');
      expect(uri).toContain(encodeURIComponent('/path/to/ca.pem'));
    });

    it('should include TLS with auth', () => {
      const profile = store.create({
        name: 'Auth+TLS',
        authEnabled: true,
        username: 'user',
        password: 'pass',
        authDatabase: 'admin',
        authMechanism: 'SCRAM-SHA-256',
        tlsEnabled: true,
        tlsAllowInvalidCertificates: true,
      });
      const uri = store.buildConnectionUri(profile);

      expect(uri).toContain('authMechanism=SCRAM-SHA-256');
      expect(uri).toContain('&tls=true');
      expect(uri).toContain('&tlsAllowInvalidCertificates=true');
    });

    it('should return raw connection string when useConnectionString is true', () => {
      const profile = store.create({
        name: 'Raw',
        useConnectionString: true,
        connectionString: 'mongodb://custom:uri@server:27017/mydb',
      });
      const uri = store.buildConnectionUri(profile);

      expect(uri).toBe('mongodb://custom:uri@server:27017/mydb');
    });

    it('should include tlsCertificateKeyFile when tlsCertFile is set', () => {
      const profile = store.create({
        name: 'ClientCert',
        tlsEnabled: true,
        tlsCertFile: '/path/to/client.pem',
      });
      const uri = store.buildConnectionUri(profile);

      expect(uri).toContain('tlsCertificateKeyFile=');
      expect(uri).toContain(encodeURIComponent('/path/to/client.pem'));
    });
  });
});
