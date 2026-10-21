import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase, type DatabaseClient } from '../src/db/client.js';
import { seedDatabase } from '../src/db/seed.js';
import { Pay3Client } from '../src/pay3/client.js';
import { OrderService } from '../src/services/order.js';
import { VerificationService } from '../src/services/verification.js';
import { MockPay3Server } from './mocks/pay3.mock.js';
import { createMockEnv, createMockExecutionContext } from './setup.js';

describe('Cron Sweeper & Batch Reconciliation (TASK-007)', () => {
  let db: DatabaseClient;
  let mockPay3Server: MockPay3Server;
  let pay3Client: Pay3Client;
  let orderService: OrderService;
  let verificationService: VerificationService;
  let mockEnv: ReturnType<typeof createMockEnv>;

  beforeEach(async () => {
    mockEnv = createMockEnv();
    const ctx = createMockExecutionContext();
    db = createDatabase(mockEnv, ctx);
    await db.init();
    await seedDatabase(db);

    mockPay3Server = new MockPay3Server(mockEnv.PAY3_JWT_SECRET);
    pay3Client = new Pay3Client({
      baseUrl: mockEnv.PAY3_BASE_URL,
      jwtSecret: mockEnv.PAY3_JWT_SECRET,
      fetchFn: mockPay3Server.createFetch(),
    });

    orderService = new OrderService(db, pay3Client);
    verificationService = new VerificationService(db, pay3Client);
  });

  it('sweeps pending orders and auto-fulfills paid orders', async () => {
    const userId1 = 'usr_sweep_1';
    const userId2 = 'usr_sweep_2';

    const order1 = await orderService.createCheckoutOrder(userId1, 'plan_starter_monthly');
    const order2 = await orderService.createCheckoutOrder(userId2, 'plan_pro_monthly');

    // In MockPay3Server, simulate order1 getting paid on chain
    const mockOrder1 = mockPay3Server.orders.get(order1.order.pay3OrderId)!;
    mockOrder1.status = 'paid';
    mockOrder1.payment.paid_amount_raw = mockOrder1.payment.amount_raw;

    // Run sweep
    const result = await verificationService.sweepPendingOrders(10);

    expect(result.sweptCount).toBe(2);
    expect(result.paidCount).toBe(1);
    expect(result.expiredCount).toBe(0);

    // Verify order 1 is paid and entitlement is created
    const o1 = await db.orders.get(order1.order.id);
    expect(o1?.status).toBe('paid');

    const ent1 = await db.entitlements.find({ userId: userId1, status: 'active' });
    expect(ent1.length).toBe(1);
    expect(ent1[0]?.planId).toBe('plan_starter_monthly');

    // Verify order 2 is still pending
    const o2 = await db.orders.get(order2.order.id);
    expect(o2?.status).toBe('pending');
  });

  it('marks orders past expires_at without payment as expired', async () => {
    const userId = 'usr_expire_test';
    const checkout = await orderService.createCheckoutOrder(userId, 'plan_starter_monthly');

    // Artificially age the order past its expiration time
    const expiredTimestamp = new Date(Date.now() - 1000).toISOString();
    await db.orders.set(checkout.order.id, {
      ...checkout.order,
      expiresAt: expiredTimestamp,
    }, {
      keys: {
        externalId: checkout.order.externalId,
        pay3OrderId: checkout.order.pay3OrderId,
        userId: checkout.order.userId,
        status: 'pending',
        receiveAddress: checkout.order.receiveAddress,
      },
    });
    await db.orders.flush();

    const result = await verificationService.sweepPendingOrders(10);
    expect(result.sweptCount).toBe(1);
    expect(result.expiredCount).toBe(1);

    const saved = await db.orders.get(checkout.order.id);
    expect(saved?.status).toBe('expired');
  });
});
