import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase, type DatabaseClient } from '../src/db/client.js';
import { seedDatabase } from '../src/db/seed.js';
import { Pay3Client } from '../src/pay3/client.js';
import { OrderService } from '../src/services/order.js';
import { MockPay3Server } from './mocks/pay3.mock.js';
import { createMockEnv, createMockExecutionContext } from './setup.js';

describe('OrderService & Checkout Flow (TASK-006)', () => {
  let db: DatabaseClient;
  let mockPay3Server: MockPay3Server;
  let pay3Client: Pay3Client;
  let orderService: OrderService;
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
  });

  it('creates checkout order successfully and persists in KVDB', async () => {
    const userId = 'usr_alice_123';
    const planId = 'plan_starter_monthly';

    const checkout = await orderService.createCheckoutOrder(userId, planId);

    expect(checkout.order.id).toMatch(/^ord_/);
    expect(checkout.order.userId).toBe(userId);
    expect(checkout.order.planId).toBe(planId);
    expect(checkout.order.status).toBe('pending');
    expect(checkout.order.amount).toBe('15.00');
    expect(checkout.order.receiveAddress).toMatch(/^0x[0-9a-f]{40}$/i);

    expect(checkout.payment.receiveAddress).toBe(checkout.order.receiveAddress);
    expect(checkout.payment.tokenSymbol).toBe('USDT');
    expect(checkout.payment.chainId).toBe(80002);

    // Verify order was saved in KVDB
    const saved = await db.orders.get(checkout.order.id);
    expect(saved).not.toBeNull();
    expect(saved?.externalId).toBe(checkout.order.externalId);
    expect(saved?.pay3OrderId).toBe(checkout.order.pay3OrderId);
  });

  it('rejects checkout for non-existent or disabled plan', async () => {
    await expect(
      orderService.createCheckoutOrder('usr_1', 'plan_non_existent')
    ).rejects.toThrow("Plan 'plan_non_existent' not found");

    // Disable starter plan
    const starter = await db.plans.get('plan_starter_monthly');
    await db.plans.set('plan_starter_monthly', { ...starter!, enabled: 0 }, {
      keys: { category: starter!.category, enabled: 0, sortOrder: starter!.sortOrder },
    });
    await db.plans.flush();

    await expect(
      orderService.createCheckoutOrder('usr_1', 'plan_starter_monthly')
    ).rejects.toThrow("Plan 'plan_starter_monthly' not found or is currently disabled");
  });

  it('handles idempotency by reusing active pending order within validity window', async () => {
    const userId = 'usr_bob_456';
    const planId = 'plan_pro_monthly';

    const first = await orderService.createCheckoutOrder(userId, planId);
    const second = await orderService.createCheckoutOrder(userId, planId);

    expect(second.order.id).toBe(first.order.id);
    expect(second.order.externalId).toBe(first.order.externalId);
    expect(second.payment.receiveAddress).toBe(first.payment.receiveAddress);
  });

  it('retrieves order details and enforces user ownership', async () => {
    const userId = 'usr_carol_789';
    const checkout = await orderService.createCheckoutOrder(userId, 'plan_starter_monthly');

    const details = await orderService.getOrderDetails(checkout.order.id, userId);
    expect(details).not.toBeNull();
    expect(details?.id).toBe(checkout.order.id);

    // Access by different user throws
    await expect(
      orderService.getOrderDetails(checkout.order.id, 'usr_unauthorized')
    ).rejects.toThrow('Unauthorized order access');
  });

  it('retrieves order by externalId using O(1) KVDB lookup', async () => {
    const userId = 'usr_dave';
    const checkout = await orderService.createCheckoutOrder(userId, 'plan_starter_monthly');

    const found = await orderService.getOrderByExternalId(checkout.order.externalId);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(checkout.order.id);
    expect(found?.userId).toBe(userId);
  });

  it('retrieves user orders with cursor pagination', async () => {
    const userId = 'usr_multi_orders';

    // Create 3 orders
    for (let i = 1; i <= 3; i++) {
      const orderId = `ord_page_test_${i}`;
      const extId = `ext_page_test_${i}`;
      await db.orders.set(
        orderId,
        {
          externalId: extId,
          pay3OrderId: `p3_${i}`,
          userId,
          planId: 'plan_starter_monthly',
          amount: '15.00',
          tokenSymbol: 'USDT',
          chainId: 80002,
          receiveAddress: `0xaddr_${i}`,
          status: 'pending',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        },
        {
          keys: {
            externalId: extId,
            pay3OrderId: `p3_${i}`,
            userId,
            status: 'pending',
            receiveAddress: `0xaddr_${i}`,
          },
        }
      );
    }
    await db.orders.flush();

    const page = await orderService.getUserOrders(userId, undefined, 2);
    expect(page.orders.length).toBe(2);
    expect(page.hasMore).toBe(true);
    expect(page.cursor).toBeDefined();

    const page2 = await orderService.getUserOrders(userId, page.cursor, 2);
    expect(page2.orders.length).toBe(1);
    expect(page2.hasMore).toBe(false);
  });

  it('updates order status and transaction details', async () => {
    const userId = 'usr_status_test';
    const checkout = await orderService.createCheckoutOrder(userId, 'plan_starter_monthly');

    const updated = await orderService.updateOrderStatus(checkout.order.id, {
      status: 'paid',
      paidAmount: '15.00',
      txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    });

    expect(updated.status).toBe('paid');
    expect(updated.paidAmount).toBe('15.00');
    expect(updated.txHash).toMatch(/^0x[a-f0-9]{64}$/i);

    const saved = await db.orders.get(checkout.order.id);
    expect(saved?.status).toBe('paid');
    expect(saved?.paidAmount).toBe('15.00');
  });
});
