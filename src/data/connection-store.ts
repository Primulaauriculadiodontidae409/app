import { getDatabase } from './database';

export interface ConnectionProfile {
  id: string;
  name: string;
  host: string;
  port: number;
  authEnabled: boolean;
  username: string;
  password: string;
  authDatabase: string;
  authMechanism: 'SCRAM-SHA-256' | 'SCRAM-SHA-1';
  tlsEnabled: boolean;
  tlsCaFile: string;
  tlsCertFile: string;
  tlsKeyFile: string;
  tlsAllowInvalidCertificates: boolean;
  connectionString: string;
  useConnectionString: boolean;
  color: string;
  createdAt: number;
  updatedAt: number;
}

const DEFAULT_PROFILE: Omit<ConnectionProfile, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  host: 'localhost',
  port: 27017,
  authEnabled: false,
  username: '',
  password: '',
  authDatabase: 'admin',
  authMechanism: 'SCRAM-SHA-256',
  tlsEnabled: false,
  tlsCaFile: '',
  tlsCertFile: '',
  tlsKeyFile: '',
  tlsAllowInvalidCertificates: false,
  connectionString: '',
  useConnectionString: false,
  color: '#FF9F1C',
};

export class ConnectionStore {
  private db: any;

  constructor() {
    this.db = getDatabase();
    this.initialize();
  }

  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS connections (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        host TEXT NOT NULL DEFAULT 'localhost',
        port INTEGER NOT NULL DEFAULT 27017,
        auth_enabled INTEGER NOT NULL DEFAULT 0,
        username TEXT NOT NULL DEFAULT '',
        password TEXT NOT NULL DEFAULT '',
        auth_database TEXT NOT NULL DEFAULT 'admin',
        auth_mechanism TEXT NOT NULL DEFAULT 'SCRAM-SHA-256',
        tls_enabled INTEGER NOT NULL DEFAULT 0,
        tls_ca_file TEXT NOT NULL DEFAULT '',
        tls_cert_file TEXT NOT NULL DEFAULT '',
        tls_key_file TEXT NOT NULL DEFAULT '',
        tls_allow_invalid_certs INTEGER NOT NULL DEFAULT 0,
        connection_string TEXT NOT NULL DEFAULT '',
        use_connection_string INTEGER NOT NULL DEFAULT 0,
        color TEXT NOT NULL DEFAULT '#FF9F1C',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
  }

  private generateId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 16; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
  }

  private rowToProfile(row: Record<string, unknown>): ConnectionProfile {
    return {
      id: row.id as string,
      name: row.name as string,
      host: row.host as string,
      port: row.port as number,
      authEnabled: (row.auth_enabled as number) === 1,
      username: row.username as string,
      password: row.password as string,
      authDatabase: row.auth_database as string,
      authMechanism: row.auth_mechanism as ConnectionProfile['authMechanism'],
      tlsEnabled: (row.tls_enabled as number) === 1,
      tlsCaFile: row.tls_ca_file as string,
      tlsCertFile: row.tls_cert_file as string,
      tlsKeyFile: row.tls_key_file as string,
      tlsAllowInvalidCertificates: (row.tls_allow_invalid_certs as number) === 1,
      connectionString: row.connection_string as string,
      useConnectionString: (row.use_connection_string as number) === 1,
      color: row.color as string,
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
    };
  }

  getAll(): ConnectionProfile[] {
    const rows = this.db.prepare('SELECT * FROM connections ORDER BY updated_at DESC').all();
    return rows.map((row: Record<string, unknown>) => this.rowToProfile(row));
  }

  getById(id: string): ConnectionProfile | null {
    const row = this.db.prepare('SELECT * FROM connections WHERE id = ?').get(id);
    if (!row) return null;
    return this.rowToProfile(row as Record<string, unknown>);
  }

  create(data: Partial<ConnectionProfile>): ConnectionProfile {
    const now = Date.now();
    const profile: ConnectionProfile = {
      ...DEFAULT_PROFILE,
      ...data,
      id: data.id || this.generateId(),
      createdAt: now,
      updatedAt: now,
    };

    this.db.prepare(
      `INSERT INTO connections (
        id, name, host, port, auth_enabled, username, password,
        auth_database, auth_mechanism, tls_enabled, tls_ca_file,
        tls_cert_file, tls_key_file, tls_allow_invalid_certs,
        connection_string, use_connection_string, color,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      profile.id, profile.name, profile.host, profile.port,
      profile.authEnabled ? 1 : 0, profile.username, profile.password,
      profile.authDatabase, profile.authMechanism,
      profile.tlsEnabled ? 1 : 0, profile.tlsCaFile,
      profile.tlsCertFile, profile.tlsKeyFile,
      profile.tlsAllowInvalidCertificates ? 1 : 0,
      profile.connectionString, profile.useConnectionString ? 1 : 0,
      profile.color, profile.createdAt, profile.updatedAt,
    );

    return profile;
  }

  update(id: string, data: Partial<ConnectionProfile>): ConnectionProfile | null {
    const existing = this.getById(id);
    if (!existing) return null;

    const updated: ConnectionProfile = {
      ...existing,
      ...data,
      id,
      updatedAt: Date.now(),
    };

    this.db.prepare(
      `UPDATE connections SET
        name = ?, host = ?, port = ?, auth_enabled = ?,
        username = ?, password = ?, auth_database = ?,
        auth_mechanism = ?, tls_enabled = ?, tls_ca_file = ?,
        tls_cert_file = ?, tls_key_file = ?, tls_allow_invalid_certs = ?,
        connection_string = ?, use_connection_string = ?, color = ?,
        updated_at = ?
      WHERE id = ?`
    ).run(
      updated.name, updated.host, updated.port,
      updated.authEnabled ? 1 : 0, updated.username, updated.password,
      updated.authDatabase, updated.authMechanism,
      updated.tlsEnabled ? 1 : 0, updated.tlsCaFile,
      updated.tlsCertFile, updated.tlsKeyFile,
      updated.tlsAllowInvalidCertificates ? 1 : 0,
      updated.connectionString, updated.useConnectionString ? 1 : 0,
      updated.color, updated.updatedAt, id,
    );

    return updated;
  }

  delete(id: string): boolean {
    const result = this.db.prepare('DELETE FROM connections WHERE id = ?').run(id);
    return result.changes > 0;
  }

  duplicate(id: string): ConnectionProfile | null {
    const existing = this.getById(id);
    if (!existing) return null;

    return this.create({
      ...existing,
      id: undefined,
      name: `${existing.name} (copy)`,
    });
  }

  buildConnectionUri(profile: ConnectionProfile): string {
    if (profile.useConnectionString && profile.connectionString) {
      return profile.connectionString;
    }

    let uri = 'mongodb://';

    if (profile.authEnabled && profile.username) {
      uri += `${encodeURIComponent(profile.username)}:${encodeURIComponent(profile.password)}@`;
    }

    uri += `${profile.host}:${profile.port}`;

    if (profile.authEnabled) {
      uri += `/${profile.authDatabase}`;
      uri += `?authMechanism=${profile.authMechanism}`;
    }

    if (profile.tlsEnabled) {
      uri += profile.authEnabled ? '&' : '/?';
      uri += 'tls=true';
      if (profile.tlsCaFile) {
        uri += `&tlsCAFile=${encodeURIComponent(profile.tlsCaFile)}`;
      }
      if (profile.tlsCertFile) {
        uri += `&tlsCertificateKeyFile=${encodeURIComponent(profile.tlsCertFile)}`;
      }
      if (profile.tlsAllowInvalidCertificates) {
        uri += '&tlsAllowInvalidCertificates=true';
      }
    }

    return uri;
  }
}
