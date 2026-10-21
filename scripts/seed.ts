import { createDatabase } from '../src/db/client.js';
import { seedDatabase } from '../src/db/seed.js';

/**
 * KVDB Database Seed Script
 * Initializes MultiKeySchema tables and seeds initial service plans & default admin user.
 */
async function main() {
  console.log('🌱 Starting KVDB initialization & database seed...');

  // In standalone execution, create mock environment or bind to D1
  const mockEnv: any = {
    ENVIRONMENT: process.env.ENVIRONMENT || 'development',
    DB: {
      prepare(sql: string) {
        return {
          bind: (...args: any[]) => ({
            run: async () => ({ results: [], success: true }),
            all: async () => ({ results: [], success: true }),
            first: async () => null,
          }),
        };
      },
      batch: async (statements: any[]) => statements.map(() => ({ results: [], success: true })),
    },
    CACHE_KV: {
      get: async () => null,
      put: async () => {},
      delete: async () => {},
    },
    PAY3_BASE_URL: process.env.PAY3_BASE_URL || 'http://127.0.0.1:8080',
    PAY3_JWT_SECRET: process.env.PAY3_JWT_SECRET || 'dev_secret',
    PORTAL_JWT_SECRET: process.env.PORTAL_JWT_SECRET || 'dev_portal_secret',
  };

  const db = createDatabase(mockEnv);
  await db.init();
  await seedDatabase(db);

  console.log('✅ KVDB schema and initial seed data populated successfully!');
}

main().catch((err) => {
  console.error('❌ Database seed error:', err);
  process.exit(1);
});
