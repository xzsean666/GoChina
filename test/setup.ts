import { DatabaseSync } from 'node:sqlite';

/**
 * Lightweight mock implementation of Cloudflare D1 Database using Node 22+ built-in node:sqlite
 */
export class MockD1PreparedStatement {
  constructor(
    private db: DatabaseSync,
    private sql: string,
    private params: unknown[] = []
  ) {}

  bind(...values: unknown[]): D1PreparedStatement {
    return new MockD1PreparedStatement(this.db, this.sql, values) as unknown as D1PreparedStatement;
  }

  async first<T = unknown>(colName?: string): Promise<T | null> {
    const stmt = this.db.prepare(this.sql);
    const row = stmt.get(...(this.params as any[])) as Record<string, unknown> | undefined;
    if (!row) return null;
    if (colName !== undefined) {
      return (row[colName] as unknown as T) ?? null;
    }
    return row as unknown as T;
  }

  async run<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    const stmt = this.db.prepare(this.sql);
    const result = stmt.run(...(this.params as any[]));
    return {
      results: [],
      success: true,
      meta: {
        duration: 0,
        size_after: 0,
        rows_read: 0,
        rows_written: Number(result.changes),
        last_row_id: Number(result.lastInsertRowid),
        changed_db: Number(result.changes) > 0,
        changes: Number(result.changes),
      },
    };
  }

  async all<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    const stmt = this.db.prepare(this.sql);
    const rows = stmt.all(...(this.params as any[])) as T[];
    return {
      results: rows,
      success: true,
      meta: {
        duration: 0,
        size_after: 0,
        rows_read: rows.length,
        rows_written: 0,
        last_row_id: 0,
        changed_db: false,
        changes: 0,
      },
    };
  }

  async raw<T = unknown[]>(): Promise<T[]> {
    const res = await this.all<Record<string, unknown>>();
    return res.results.map((r) => Object.values(r) as T);
  }
}

export class MockD1Database {
  public db: DatabaseSync;

  constructor() {
    this.db = new DatabaseSync(':memory:');
  }

  prepare(sql: string): D1PreparedStatement {
    return new MockD1PreparedStatement(this.db, sql) as unknown as D1PreparedStatement;
  }

  async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
    const results: D1Result<T>[] = [];
    this.db.exec('BEGIN TRANSACTION;');
    try {
      for (const stmt of statements) {
        const mockStmt = stmt as unknown as MockD1PreparedStatement;
        const res = await mockStmt.run<T>();
        results.push(res);
      }
      this.db.exec('COMMIT;');
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
    return results;
  }

  async exec(query: string): Promise<D1ExecResult> {
    this.db.exec(query);
    return { count: 0, duration: 0 };
  }

  async dump(): Promise<ArrayBuffer> {
    return new ArrayBuffer(0);
  }
}

export class MockKVNamespace {
  private store = new Map<string, { value: string; expiration?: number; metadata?: any }>();

  async get(key: string, options?: any): Promise<any> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiration && entry.expiration <= Math.floor(Date.now() / 1000)) {
      this.store.delete(key);
      return null;
    }
    const type = typeof options === 'string' ? options : options?.type;
    if (type === 'json') {
      try {
        return JSON.parse(entry.value);
      } catch {
        return null;
      }
    }
    return entry.value;
  }

  async put(key: string, value: string, options?: { expirationTtl?: number; metadata?: any }): Promise<void> {
    let expiration: number | undefined;
    if (options?.expirationTtl) {
      expiration = Math.floor(Date.now() / 1000) + options.expirationTtl;
    }
    this.store.set(key, { value, expiration, metadata: options?.metadata });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list(options?: any): Promise<any> {
    const keys = Array.from(this.store.keys()).map((name) => ({ name }));
    return { keys, list_complete: true, cursor: '' };
  }
}

export function createMockExecutionContext(): ExecutionContext {
  const promises: Promise<any>[] = [];
  return {
    waitUntil(promise: Promise<any>) {
      promises.push(promise);
    },
    passThroughOnException() {},
  } as unknown as ExecutionContext;
}

export function createMockEnv() {
  return {
    DB: new MockD1Database() as unknown as D1Database,
    CACHE_KV: new MockKVNamespace() as unknown as KVNamespace,
    ENVIRONMENT: 'test',
    PAY3_BASE_URL: 'http://127.0.0.1:8080',
    PAY3_JWT_SECRET: 'test_jwt_secret_pay3_key_1234567890',
    PORTAL_JWT_SECRET: 'test_jwt_secret_portal_key_1234567890',
  };
}
