import { describe, it, expect, beforeEach } from 'vitest';
import { privateKeyToAccount } from 'viem/accounts';
import worker, { type Env } from '../src/index.js';
import { seedDatabase } from '../src/db/seed.js';
import { createDatabase } from '../src/db/client.js';
import { MockPay3Server } from './mocks/pay3.mock.js';
import { createMockEnv, createMockExecutionContext } from './setup.js';
import { handleScheduledSweep } from '../src/cron/sweeper.js';

describe('End-to-End User Journey & Platform Integration (TASK-016)', () => {
  let env: Env;
  let ctx: ExecutionContext;
  let mockPay3Server: MockPay3Server;

  beforeEach(async () => {
    env = createMockEnv();
    ctx = createMockExecutionContext();

    const db = createDatabase(env, ctx);
    await db.init();
    await seedDatabase(db);

    mockPay3Server = new MockPay3Server(env.PAY3_JWT_SECRET);
    const mockFetch = mockPay3Server.createFetch();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString();
      if (url.startsWith('http://127.0.0.1:8080') || url.startsWith('http://pay3.internal')) {
        return await mockFetch(input, init);
      }
      return await originalFetch(input, init);
    };
  });

  it('completes the entire end-to-end user journey flawlessly', async () => {
    // -------------------------------------------------------------
    // Step 1: User Web3 Wallet Authentication (Email OTP Disabled)
    // -------------------------------------------------------------
    const otpReqRes = await worker.fetch(
      new Request('http://localhost/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'alex.traveler@example.com' }),
      }),
      env,
      ctx
    );
    expect(otpReqRes.status).toBe(400);
    const otpData = (await otpReqRes.json()) as any;
    expect(otpData.error).toMatch(/disabled/i);

    // Sign in with Web3 wallet
    const alexAccount = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
    const walletAddress = alexAccount.address;
    const alexMsg = `Sign in to GoChina Portal at ${Date.now()}`;
    const alexSig = await alexAccount.signMessage({ message: alexMsg });

    const authRes = await worker.fetch(
      new Request('http://localhost/api/auth/web3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: walletAddress,
          signature: alexSig,
          message: alexMsg,
        }),
      }),
      env,
      ctx
    );
    expect(authRes.status).toBe(200);
    const authData = (await authRes.json()) as any;
    expect(authData.token).toBeDefined();
    expect(authData.user.walletAddress).toBe(walletAddress.toLowerCase());
    const userToken = authData.token;

    // -------------------------------------------------------------
    // Step 2: Browse Active Service Plans from KVDB Edge Cache
    // -------------------------------------------------------------
    const plansRes = await worker.fetch(
      new Request('http://localhost/api/plans'),
      env,
      ctx
    );
    expect(plansRes.status).toBe(200);
    const plansData = (await plansRes.json()) as any;
    expect(plansData.plans.length).toBeGreaterThan(0);
    const selectedPlan = plansData.plans.find((p: any) => p.category === 'Pro') || plansData.plans[0];
    expect(selectedPlan).toBeDefined();

    // -------------------------------------------------------------
    // Step 3: Initiate Checkout -> Create Order with Pay3 Child Address
    // -------------------------------------------------------------
    const orderRes = await worker.fetch(
      new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          chainId: 1,
          tokenSymbol: 'USDT',
        }),
      }),
      env,
      ctx
    );
    expect(orderRes.status).toBe(201);
    const orderData = (await orderRes.json()) as any;
    const order = orderData.order;
    const payment = orderData.payment;
    expect(order.id).toBeDefined();
    expect(order.status).toBe('pending');
    expect(payment.receiveAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(order.pay3OrderId).toBeDefined();

    // -------------------------------------------------------------
    // Step 4: Simulate EVM Blockchain Payment in Pay3 Mock
    // -------------------------------------------------------------
    const mockOrder = mockPay3Server.orders.get(order.pay3OrderId);
    if (mockOrder) {
      mockOrder.status = 'paid';
      mockOrder.payment.paid_amount_raw = mockOrder.payment.amount_raw;
    }

    // -------------------------------------------------------------
    // Step 5: User Clicks "I Have Paid" -> Instant Verification & Fulfillment
    // -------------------------------------------------------------
    const verifyRes = await worker.fetch(
      new Request(`http://localhost/api/orders/${order.id}/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }),
      env,
      ctx
    );
    expect(verifyRes.status).toBe(200);
    const verifyData = (await verifyRes.json()) as any;
    expect(verifyData.paid).toBe(true);
    expect(verifyData.order.status).toBe('paid');
    expect(verifyData.entitlement).toBeDefined();

    // -------------------------------------------------------------
    // Step 6: Query Active Entitlements from User Dashboard
    // -------------------------------------------------------------
    const entRes = await worker.fetch(
      new Request('http://localhost/api/user/entitlements', {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }),
      env,
      ctx
    );
    expect(entRes.status).toBe(200);
    const entData = (await entRes.json()) as any;
    expect(entData.entitlements.length).toBe(1);

    const activeEnt = entData.entitlements[0];
    expect(activeEnt.userId).toBe(authData.user.id);
    expect(activeEnt.planId).toBe(selectedPlan.id);
    expect(activeEnt.status).toBe('active');
    expect(activeEnt.token).toMatch(/^goc_/);
    expect(activeEnt.quota).toBeDefined();
    expect(activeEnt.usage.usedCalls).toBe(0);
    expect(activeEnt.expireTime).toBeGreaterThan(Date.now());

    // -------------------------------------------------------------
    // Step 7: Verify Scheduled Cron Sweeper Behavior
    // -------------------------------------------------------------
    const sweepResult = await handleScheduledSweep(env, ctx);
    expect(sweepResult).toBeDefined();
    expect(typeof sweepResult.sweptCount).toBe('number');

    // -------------------------------------------------------------
    // Step 8: Admin Panel Audits Orders & Pay3 Transactions
    // -------------------------------------------------------------
    // Attempt with standard user token (should return 403 Forbidden)
    const forbiddenAdminRes = await worker.fetch(
      new Request('http://localhost/api/admin/orders', {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }),
      env,
      ctx
    );
    expect(forbiddenAdminRes.status).toBe(403);

    // Login as Admin via Web3 wallet with valid signature
    const adminAccount = privateKeyToAccount('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d');
    const adminWallet = adminAccount.address.toLowerCase();
    const adminMsg = `Sign in to GoChina Portal at ${Date.now()}`;
    const adminSig = await adminAccount.signMessage({ message: adminMsg });

    const adminLoginRes = await worker.fetch(
      new Request('http://localhost/api/auth/web3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: adminWallet,
          signature: adminSig,
          message: adminMsg,
        }),
      }),
      env,
      ctx
    );
    expect(adminLoginRes.status).toBe(200);
    const adminAuthData = (await adminLoginRes.json()) as any;
    expect(adminAuthData.user.role).toBe('admin');
    const adminToken = adminAuthData.token;

    // Fetch Admin Orders list
    const adminOrdersRes = await worker.fetch(
      new Request('http://localhost/api/admin/orders', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }),
      env,
      ctx
    );
    expect(adminOrdersRes.status).toBe(200);
    const adminOrdersData = (await adminOrdersRes.json()) as any;
    expect(adminOrdersData.orders.length).toBeGreaterThan(0);
    const auditedOrder = adminOrdersData.orders.find((o: any) => o.id === order.id);
    expect(auditedOrder).toBeDefined();
    expect(auditedOrder.status).toBe('paid');
    expect(auditedOrder.pay3OrderId).toBe(order.pay3OrderId);
  });
});
