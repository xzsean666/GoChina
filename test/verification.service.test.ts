import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase, type DatabaseClient } from '../src/db/client.js';
import { seedDatabase } from '../src/db/seed.js';
import { Pay3Client } from '../src/pay3/client.js';
import { OrderService } from '../src/services/order.js';
import { VerificationService } from '../src/services/verification.js';
import { MockPay3Server } from './mocks/pay3.mock.js';
import { createMockEnv, createMockExecutionContext } from './setup.js';

describe('VerificationService (TASK-007)', () => {
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

  it('instantly verifies pending order, transitions to paid, and provisions entitlement', async () => {
    const userId = 'usr_verify_1';
    const checkout = await orderService.createCheckoutOrder(userId, 'plan_starter_monthly');

    expect(checkout.order.status).toBe('pending');

    // Trigger instant verification
    const verifyResult = await verificationService.verifyOrderInstant(checkout.order.id, userId);

    expect(verifyResult.paid).toBe(true);
    expect(verifyResult.order.status).toBe('paid');
    expect(verifyResult.entitlement).toBeDefined();
    expect(verifyResult.entitlement?.userId).toBe(userId);
    expect(verifyResult.entitlement?.token).toMatch(/^goc_live_/);
    expect(verifyResult.entitlement?.status).toBe('active');
    expect(verifyResult.entitlement?.quota.apiCalls).toBe(100000);

    // Verify database state
    const orderInDb = await db.orders.get(checkout.order.id);
    expect(orderInDb?.status).toBe('paid');

    const entInDb = await db.entitlements.getBy('token', verifyResult.entitlement!.token);
    expect(entInDb).not.toBeNull();
    expect(entInDb?.userId).toBe(userId);
  });

  it('extends existing entitlement if user already has an active entitlement for the same plan', async () => {
    const userId = 'usr_extend_1';
    const firstCheckout = await orderService.createCheckoutOrder(userId, 'plan_starter_monthly');
    const firstVerify = await verificationService.verifyOrderInstant(firstCheckout.order.id, userId);

    const firstExpiry = firstVerify.entitlement!.expireTime;

    // Second purchase for the same plan
    // Clear pending orders to allow new checkout
    await db.orders.set(firstCheckout.order.id, {
      ...firstCheckout.order,
      status: 'paid',
    });
    await db.orders.flush();

    const secondCheckout = await orderService.createCheckoutOrder(userId, 'plan_starter_monthly');
    const secondVerify = await verificationService.verifyOrderInstant(secondCheckout.order.id, userId);

    expect(secondVerify.paid).toBe(true);
    expect(secondVerify.entitlement!.id).toBe(firstVerify.entitlement!.id);
    expect(secondVerify.entitlement!.expireTime).toBeGreaterThan(firstExpiry);
  });

  it('returns idempotent response if order is already paid', async () => {
    const userId = 'usr_idempotent_verify';
    const checkout = await orderService.createCheckoutOrder(userId, 'plan_starter_monthly');

    await verificationService.verifyOrderInstant(checkout.order.id, userId);
    const second = await verificationService.verifyOrderInstant(checkout.order.id, userId);

    expect(second.paid).toBe(true);
    expect(second.message).toBe('Order has already been fulfilled');
  });

  it('rejects instant verification from non-owner user', async () => {
    const checkout = await orderService.createCheckoutOrder('usr_owner', 'plan_starter_monthly');

    await expect(
      verificationService.verifyOrderInstant(checkout.order.id, 'usr_intruder')
    ).rejects.toThrow('Unauthorized order access');
  });
});
