import { describe, it, expect, beforeEach } from 'vitest';
import { Pay3Client } from '../src/pay3/client.js';
import { Pay3ApiError } from '../src/pay3/errors.js';
import { MockPay3Server } from './mocks/pay3.mock.js';

describe('Pay3Client & Scope JWT Provider (TASK-005)', () => {
  const JWT_SECRET = 'test_pay3_gateway_secret_key_1234567890';
  let mockServer: MockPay3Server;
  let client: Pay3Client;

  beforeEach(() => {
    mockServer = new MockPay3Server(JWT_SECRET);
    client = new Pay3Client({
      baseUrl: 'http://pay3.internal',
      jwtSecret: JWT_SECRET,
      jwtIssuer: 'pay3',
      jwtAudience: 'pay3-api',
      fetchFn: mockServer.createFetch(),
    });
  });

  it('creates order with HD derived address and 201 response', async () => {
    const res = await client.createOrder({
      externalId: 'ext_test_order_001',
      amount: '15.00',
      ttlSeconds: 3600,
      metadata: { userId: 'usr_123' },
    });

    expect(res.id).toMatch(/^p3_ord_/);
    expect(res.external_id).toBe('ext_test_order_001');
    expect(res.status).toBe('pending');
    expect(res.payment.receive_address).toMatch(/^0x[0-9a-f]{40}$/i);
    expect(res.payment.token_symbol).toBe('USDT');
    expect(res.payment.amount_raw).toBe('15000000');
    expect(res.payment.expires_at).toBeDefined();
  });

  it('handles idempotent createOrder calls returning 200 with same address', async () => {
    const first = await client.createOrder({
      externalId: 'ext_test_order_idempotent',
      amount: '45.00',
      ttlSeconds: 3600,
    });

    const second = await client.createOrder({
      externalId: 'ext_test_order_idempotent',
      amount: '45.00',
      ttlSeconds: 3600,
    });

    expect(second.id).toBe(first.id);
    expect(second.payment.receive_address).toBe(first.payment.receive_address);
  });

  it('retrieves order by Pay3 ID and by externalId', async () => {
    const created = await client.createOrder({
      externalId: 'ext_test_order_fetch',
      amount: '15.00',
      ttlSeconds: 1800,
    });

    const byId = await client.getOrder(created.id);
    expect(byId.id).toBe(created.id);
    expect(byId.external_id).toBe('ext_test_order_fetch');

    const byExtId = await client.getOrderByExternalId('ext_test_order_fetch');
    expect(byExtId.id).toBe(created.id);
    expect(byExtId.payment.receive_address).toBe(created.payment.receive_address);
  });

  it('verifies order on-chain and updates status to paid', async () => {
    const created = await client.createOrder({
      externalId: 'ext_test_order_verify',
      amount: '15.00',
      ttlSeconds: 3600,
    });

    expect(created.status).toBe('pending');

    const verified = await client.verifyOrder(created.id);
    expect(verified.status).toBe('paid');
    expect(verified.payment.paid_amount_raw).toBe(verified.payment.amount_raw);
  });

  it('throws typed Pay3ApiError on missing or invalid order', async () => {
    await expect(client.getOrder('non_existent_id')).rejects.toThrow(Pay3ApiError);
    await expect(client.getOrder('non_existent_id')).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  it('rejects calls when JWT secret is invalid', async () => {
    const badClient = new Pay3Client({
      baseUrl: 'http://pay3.internal',
      jwtSecret: 'wrong_secret_key_1234567890',
      fetchFn: mockServer.createFetch(),
    });

    await expect(
      badClient.createOrder({
        externalId: 'ext_bad_auth',
        amount: '15.00',
        ttlSeconds: 3600,
      })
    ).rejects.toThrow(Pay3ApiError);
  });
});
