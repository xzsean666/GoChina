import { describe, it, expect, beforeEach } from 'vitest';
import { privateKeyToAccount } from 'viem/accounts';
import worker, { type Env } from '../src/index.js';
import { seedDatabase } from '../src/db/seed.js';
import { createDatabase } from '../src/db/client.js';
import { MockPay3Server } from './mocks/pay3.mock.js';
import { createMockEnv, createMockExecutionContext } from './setup.js';

describe('Workers API Gateway & REST Controllers (TASK-010)', () => {
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
    // Wire mock fetch into global fetch when target is PAY3_BASE_URL
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

  it('handles health and readiness probes', async () => {
    const res = await worker.fetch(new Request('http://localhost/health'), env, ctx);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.status).toBe('ok');

    const resZ = await worker.fetch(new Request('http://localhost/healthz'), env, ctx);
    expect(resZ.status).toBe(200);
  });

  it('handles CORS preflight OPTIONS requests', async () => {
    const res = await worker.fetch(
      new Request('http://localhost/api/plans', {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://portal.gochina.io',
          'Access-Control-Request-Method': 'GET',
        },
      }),
      env,
      ctx
    );

    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('lists public service catalog plans', async () => {
    const res = await worker.fetch(new Request('http://localhost/api/plans'), env, ctx);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.plans).toBeInstanceOf(Array);
    expect(body.plans.length).toBeGreaterThanOrEqual(3);

    const firstPlan = body.plans[0];
    const resDetail = await worker.fetch(
      new Request(`http://localhost/api/plans/${firstPlan.id}`),
      env,
      ctx
    );
    expect(resDetail.status).toBe(200);
    const detailBody = await resDetail.json() as any;
    expect(detailBody.plan.id).toBe(firstPlan.id);
  });

  it('performs end-to-end user authentication and checkout flow', async () => {
    // 1. Verify OTP request is disabled
    const otpRes = await worker.fetch(
      new Request('http://localhost/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'client@gochina.io' }),
      }),
      env,
      ctx
    );
    expect(otpRes.status).toBe(400);
    const otpBody = await otpRes.json() as any;
    expect(otpBody.error).toMatch(/disabled/i);

    // 2. Web3 Wallet Signature Authentication
    const userAccount = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
    const walletAddress = userAccount.address;
    const loginMessage = `Sign in to GoChina Portal at ${Date.now()}`;
    const loginSignature = await userAccount.signMessage({ message: loginMessage });

    const loginRes = await worker.fetch(
      new Request('http://localhost/api/auth/web3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: walletAddress,
          signature: loginSignature,
          message: loginMessage,
        }),
      }),
      env,
      ctx
    );
    expect(loginRes.status).toBe(200);
    const loginBody = await loginRes.json() as any;
    const token = loginBody.token;
    expect(token).toBeDefined();
    expect(loginBody.user.walletAddress).toBe(walletAddress.toLowerCase());

    // 3. Get profile
    const profileRes = await worker.fetch(
      new Request('http://localhost/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
      }),
      env,
      ctx
    );
    expect(profileRes.status).toBe(200);
    const profileBody = await profileRes.json() as any;
    expect(profileBody.user.walletAddress).toBe(walletAddress.toLowerCase());

    // 4. Create checkout order
    const orderRes = await worker.fetch(
      new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId: 'plan_starter_monthly' }),
      }),
      env,
      ctx
    );
    expect(orderRes.status).toBe(201);
    const orderBody = await orderRes.json() as any;
    expect(orderBody.order.id).toBeDefined();
    expect(orderBody.payment.receiveAddress).toMatch(/^0x[0-9a-f]{40}$/i);
    const orderId = orderBody.order.id;

    // 5. Get order detail
    const detailRes = await worker.fetch(
      new Request(`http://localhost/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      env,
      ctx
    );
    expect(detailRes.status).toBe(200);

    // 6. Verify order payment
    const verifyRes = await worker.fetch(
      new Request(`http://localhost/api/orders/${orderId}/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }),
      env,
      ctx
    );
    expect(verifyRes.status).toBe(200);
    const verifyBody = await verifyRes.json() as any;
    expect(verifyBody.paid).toBe(true);
    expect(verifyBody.entitlement).toBeDefined();
    const entToken = verifyBody.entitlement.token;

    // 7. Verify entitlement token via service endpoint
    const tokenVerifyRes = await worker.fetch(
      new Request('http://localhost/api/entitlements/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: entToken }),
      }),
      env,
      ctx
    );
    expect(tokenVerifyRes.status).toBe(200);

    // 8. Consume quota
    const consumeRes = await worker.fetch(
      new Request('http://localhost/api/entitlements/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: entToken, calls: 5, bandwidthBytes: 1024 }),
      }),
      env,
      ctx
    );
    expect(consumeRes.status).toBe(200);
    const consumeBody = await consumeRes.json() as any;
    expect(consumeBody.usedCalls).toBe(5);
  });

  it('enforces RBAC on admin endpoints', async () => {
    // Normal user token
    const normalAccount = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
    const normalAddress = normalAccount.address;
    const userMsg = `Sign in to GoChina Portal at ${Date.now()}`;
    const userSig = await normalAccount.signMessage({ message: userMsg });

    const loginRes = await worker.fetch(
      new Request('http://localhost/api/auth/web3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: normalAddress,
          signature: userSig,
          message: userMsg,
        }),
      }),
      env,
      ctx
    );
    const { token: userToken } = await loginRes.json() as any;

    // Regular user rejected with 403 on /api/admin/plans
    const resUserForbidden = await worker.fetch(
      new Request('http://localhost/api/admin/plans', {
        headers: { Authorization: `Bearer ${userToken}` },
      }),
      env,
      ctx
    );
    expect(resUserForbidden.status).toBe(403);

    // Ensure admin user in db
    const db = createDatabase(env, ctx);
    const adminAccount = privateKeyToAccount('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d');
    const adminWallet = adminAccount.address.toLowerCase();

    const existingAdmin = await db.users.getBy('walletAddress', adminWallet);
    if (!existingAdmin) {
      await db.users.set('usr_admin_test', {
        email: 'admin@gochina.io',
        walletAddress: adminWallet,
        role: 'admin',
        status: 'active',
      }, {
        keys: { email: 'admin@gochina.io', walletAddress: adminWallet, role: 'admin', status: 'active' },
      });
      await db.users.flush();
    }

    // Login admin via Web3 wallet with valid signature
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
    const { token: adminToken } = await adminLoginRes.json() as any;

    // Admin user succeeds with 200 on /api/admin/plans
    const resAdminOk = await worker.fetch(
      new Request('http://localhost/api/admin/plans', {
        headers: { Authorization: `Bearer ${adminToken}` },
      }),
      env,
      ctx
    );
    expect(resAdminOk.status).toBe(200);

    // Admin user succeeds on /api/admin/orders
    const resOrdersAdmin = await worker.fetch(
      new Request('http://localhost/api/admin/orders', {
        headers: { Authorization: `Bearer ${adminToken}` },
      }),
      env,
      ctx
    );
    expect(resOrdersAdmin.status).toBe(200);
  });
});
