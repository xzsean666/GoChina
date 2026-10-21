import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase, type DatabaseClient } from '../src/db/client.js';
import { seedDatabase, INITIAL_PLANS } from '../src/db/seed.js';
import { createMockEnv, createMockExecutionContext } from './setup.js';

describe('Database Layer with cloudflare-worker-kvdb (TASK-003)', () => {
  let db: DatabaseClient;
  let mockEnv: ReturnType<typeof createMockEnv>;

  beforeEach(async () => {
    mockEnv = createMockEnv();
    const ctx = createMockExecutionContext();
    db = createDatabase(mockEnv, ctx);
    await db.init();
  });

  it('initializes tables and registers schemas correctly', async () => {
    expect(db.users).toBeDefined();
    expect(db.plans).toBeDefined();
    expect(db.orders).toBeDefined();
    expect(db.entitlements).toBeDefined();
  });

  it('seeds initial plans into database idempotently', async () => {
    await seedDatabase(db);

    const plans = await db.plans.find({ enabled: 1 });
    expect(plans.length).toBe(INITIAL_PLANS.length);

    const starter = await db.plans.get('plan_starter_monthly');
    expect(starter).not.toBeNull();
    expect(starter?.name).toBe('Starter Monthly');
    expect(starter?.priceUsd).toBe('15.00');

    // Run seed again to check idempotency
    await seedDatabase(db);
    const plansAfter = await db.plans.find({ enabled: 1 });
    expect(plansAfter.length).toBe(INITIAL_PLANS.length);
  });

  it('performs O(1) point lookups via getBy for users', async () => {
    const userId = 'usr_test_1001';
    await db.users.set(
      userId,
      {
        email: 'alice@gochina.io',
        name: 'Alice',
        role: 'user',
        status: 'active',
        walletAddress: '0x1111111111111111111111111111111111111111',
      },
      {
        keys: {
          email: 'alice@gochina.io',
          walletAddress: '0x1111111111111111111111111111111111111111',
          role: 'user',
          status: 'active',
        },
      }
    );
    await db.users.flush();

    // 1. Direct get
    const userDirect = await db.users.get(userId);
    expect(userDirect?.name).toBe('Alice');

    // 2. getBy email
    const userByEmail = await db.users.getBy('email', 'alice@gochina.io');
    expect(userByEmail).not.toBeNull();
    expect(userByEmail?.key).toBe(userId);
    expect(userByEmail?.name).toBe('Alice');

    // 3. getBy walletAddress
    const userByWallet = await db.users.getBy('walletAddress', '0x1111111111111111111111111111111111111111');
    expect(userByWallet).not.toBeNull();
    expect(userByWallet?.key).toBe(userId);
  });

  it('handles orders lifecycle and externalId lookups', async () => {
    const orderId = 'ord_test_2001';
    const externalId = 'ext_pay3_order_20261019_01';
    const pay3OrderId = 'p3_uuid_9999';

    await db.orders.set(
      orderId,
      {
        externalId,
        pay3OrderId,
        userId: 'usr_test_1001',
        planId: 'plan_starter_monthly',
        amount: '15.00',
        tokenSymbol: 'USDT',
        chainId: 80002,
        receiveAddress: '0x9999999999999999999999999999999999999999',
        status: 'pending',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      },
      {
        keys: {
          externalId,
          pay3OrderId,
          userId: 'usr_test_1001',
          status: 'pending',
          receiveAddress: '0x9999999999999999999999999999999999999999',
        },
      }
    );
    await db.orders.flush();

    const order = await db.orders.getBy('externalId', externalId);
    expect(order).not.toBeNull();
    expect(order?.key).toBe(orderId);
    expect(order?.amount).toBe('15.00');

    const orderByPay3 = await db.orders.getBy('pay3OrderId', pay3OrderId);
    expect(orderByPay3).not.toBeNull();
    expect(orderByPay3?.key).toBe(orderId);
  });

  it('handles entitlements and token lookups', async () => {
    const entId = 'ent_test_3001';
    const token = 'goc_live_secret_token_123456';

    await db.entitlements.set(
      entId,
      {
        token,
        userId: 'usr_test_1001',
        planId: 'plan_starter_monthly',
        orderId: 'ord_test_2001',
        status: 'active',
        startTime: Date.now(),
        expireTime: Date.now() + 30 * 86400 * 1000,
        quota: { apiCalls: 100000, bandwidthBytes: 10737418240 },
        usage: { usedCalls: 0, usedBandwidth: 0 },
      },
      {
        keys: {
          token,
          userId: 'usr_test_1001',
          planId: 'plan_starter_monthly',
          status: 'active',
          expireTime: Date.now() + 30 * 86400 * 1000,
        },
      }
    );
    await db.entitlements.flush();

    const entitlement = await db.entitlements.getBy('token', token);
    expect(entitlement).not.toBeNull();
    expect(entitlement?.key).toBe(entId);
    expect(entitlement?.status).toBe('active');
  });

  it('performs keyset cursor pagination with findPage', async () => {
    const userId = 'usr_page_test';

    // Insert 5 orders
    for (let i = 1; i <= 5; i++) {
      await db.orders.set(
        `ord_page_${i}`,
        {
          externalId: `ext_page_${i}`,
          pay3OrderId: `p3_page_${i}`,
          userId,
          planId: 'plan_starter_monthly',
          amount: '15.00',
          tokenSymbol: 'USDT',
          chainId: 80002,
          receiveAddress: `0xaddr_${i}`,
          status: 'pending',
          expiresAt: new Date().toISOString(),
        },
        {
          keys: {
            externalId: `ext_page_${i}`,
            pay3OrderId: `p3_page_${i}`,
            userId,
            status: 'pending',
            receiveAddress: `0xaddr_${i}`,
          },
        }
      );
    }
    await db.orders.flush();

    // Page 1: limit 2
    const page1 = await db.orders.findPage(
      { userId },
      { limit: 2, sort: [{ field: 'created_at', direction: 'desc' }] }
    );
    expect(page1.items.length).toBe(2);
    expect(page1.complete).toBe(false);
    expect(page1.cursor).toBeDefined();

    // Page 2: limit 2 with cursor
    const page2 = await db.orders.findPage(
      { userId },
      { limit: 2, cursor: page1.cursor, sort: [{ field: 'created_at', direction: 'desc' }] }
    );
    expect(page2.items.length).toBe(2);
    expect(page2.cursor).toBeDefined();

    // Ensure items between page 1 and page 2 are distinct
    const idsPage1 = page1.items.map((i: any) => i.id ?? i.externalId);
    const idsPage2 = page2.items.map((i: any) => i.id ?? i.externalId);
    for (const id of idsPage1) {
      expect(idsPage2).not.toContain(id);
    }
  });
});
