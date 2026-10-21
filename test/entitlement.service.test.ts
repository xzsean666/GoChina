import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase, type DatabaseClient } from '../src/db/client.js';
import { seedDatabase } from '../src/db/seed.js';
import { EntitlementService } from '../src/services/entitlement.js';
import { createMockEnv, createMockExecutionContext } from './setup.js';

describe('EntitlementService (TASK-009)', () => {
  let db: DatabaseClient;
  let entitlementService: EntitlementService;
  let mockEnv: ReturnType<typeof createMockEnv>;

  beforeEach(async () => {
    mockEnv = createMockEnv();
    const ctx = createMockExecutionContext();
    db = createDatabase(mockEnv, ctx);
    await db.init();
    await seedDatabase(db);

    entitlementService = new EntitlementService(db);
  });

  it('provisions new entitlement with secure token and quota', async () => {
    const userId = 'usr_ent_test_1';
    const planId = 'plan_starter_monthly';

    const ent = await entitlementService.provisionOrExtendEntitlement(userId, planId, 'ord_123');

    expect(ent.id).toMatch(/^ent_/);
    expect(ent.userId).toBe(userId);
    expect(ent.planId).toBe(planId);
    expect(ent.status).toBe('active');
    expect(ent.token).toMatch(/^goc_live_[0-9a-f]{48}$/);
    expect(ent.quota.apiCalls).toBe(100000);
    expect(ent.usage.usedCalls).toBe(0);

    const saved = await db.entitlements.getBy('token', ent.token);
    expect(saved).not.toBeNull();
    expect(saved?.key).toBe(ent.id);
  });

  it('extends existing active entitlement period and adds quota on renewal', async () => {
    const userId = 'usr_renewal';
    const planId = 'plan_starter_monthly';

    const first = await entitlementService.provisionOrExtendEntitlement(userId, planId);
    const firstExpire = first.expireTime;
    const firstQuotaCalls = first.quota.apiCalls!;

    const second = await entitlementService.provisionOrExtendEntitlement(userId, planId);

    expect(second.id).toBe(first.id);
    expect(second.token).toBe(first.token);
    expect(second.expireTime).toBeGreaterThan(firstExpire);
    expect(second.quota.apiCalls).toBe(firstQuotaCalls * 2);
  });

  it('rejects provisioning with invalid plan', async () => {
    await expect(
      entitlementService.provisionOrExtendEntitlement('usr_1', 'non_existent_plan')
    ).rejects.toThrow("Plan 'non_existent_plan' not found");
  });

  it('verifies entitlement token status correctly', async () => {
    const userId = 'usr_token_check';
    const ent = await entitlementService.provisionOrExtendEntitlement(userId, 'plan_starter_monthly');

    // 1. Valid token
    const verifyValid = await entitlementService.verifyEntitlementToken(ent.token);
    expect(verifyValid.valid).toBe(true);
    expect(verifyValid.entitlement?.id).toBe(ent.id);

    // 2. Non-existent token
    const verifyNotFound = await entitlementService.verifyEntitlementToken('goc_live_fake_token');
    expect(verifyNotFound.valid).toBe(false);
    expect(verifyNotFound.reason).toBe('NOT_FOUND');

    // 3. Expired token
    await db.entitlements.set(ent.id, {
      ...ent,
      expireTime: Date.now() - 5000,
    }, {
      keys: {
        token: ent.token,
        userId: ent.userId,
        planId: ent.planId,
        status: 'active',
        expireTime: Date.now() - 5000,
      },
    });
    await db.entitlements.flush();

    const verifyExpired = await entitlementService.verifyEntitlementToken(ent.token);
    expect(verifyExpired.valid).toBe(false);
    expect(verifyExpired.reason).toBe('EXPIRED');
  });

  it('records usage atomically and rejects when quota is exhausted', async () => {
    const userId = 'usr_usage_test';
    // Create a plan with tiny quota for testing
    await db.plans.set('plan_tiny', {
      name: 'Tiny Plan',
      description: 'Tiny',
      priceUsd: '1.00',
      tokenAmount: '1.00',
      tokenSymbol: 'USDT',
      durationDays: 30,
      features: [],
      quota: { apiCalls: 10, bandwidthBytes: 1000 },
      category: 'test',
      enabled: 1,
      sortOrder: 99,
    }, {
      keys: { category: 'test', enabled: 1, sortOrder: 99 },
    });
    await db.plans.flush();

    const ent = await entitlementService.provisionOrExtendEntitlement(userId, 'plan_tiny');

    // Record usage 6 calls
    const res1 = await entitlementService.recordUsage(ent.token, 6, 200);
    expect(res1.success).toBe(true);
    expect(res1.usedCalls).toBe(6);
    expect(res1.remainingCalls).toBe(4);
    expect(res1.exhausted).toBe(false);

    // Record usage 4 more calls -> hits 10
    const res2 = await entitlementService.recordUsage(ent.token, 4, 100);
    expect(res2.usedCalls).toBe(10);
    expect(res2.remainingCalls).toBe(0);
    expect(res2.exhausted).toBe(true);

    // Further usage rejected
    await expect(
      entitlementService.recordUsage(ent.token, 1, 10)
    ).rejects.toThrow('Cannot record usage: QUOTA_EXHAUSTED');

    // Reject negative and malformed calls/bandwidth
    await expect(
      entitlementService.recordUsage(ent.token, -1, 0)
    ).rejects.toThrow('calls must be a non-negative integer');

    await expect(
      entitlementService.recordUsage(ent.token, 1, -50)
    ).rejects.toThrow('bandwidthBytes must be a non-negative number');

    await expect(
      entitlementService.recordUsage(ent.token, 1.5, 0)
    ).rejects.toThrow('calls must be a non-negative integer');
  });

  it('retrieves user entitlement list', async () => {
    const userId = 'usr_list_test';
    await entitlementService.provisionOrExtendEntitlement(userId, 'plan_starter_monthly');

    const list = await entitlementService.getUserEntitlements(userId);
    expect(list.length).toBe(1);
    expect(list[0]?.userId).toBe(userId);
  });
});
