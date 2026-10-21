import type { DatabaseClient } from '../db/client.js';
import type { Entitlement, EntitlementData, EntitlementStatus } from '../types/models.js';
import type { VerifyTokenResult, RecordUsageResult } from '../types/entitlement.js';

export class EntitlementService {
  constructor(private db: DatabaseClient) {}

  async provisionOrExtendEntitlement(
    userId: string,
    planId: string,
    orderId?: string
  ): Promise<Entitlement> {
    const plan = await this.db.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan '${planId}' not found`);
    }

    const now = Date.now();
    const durationMs = (plan.durationDays || 30) * 86400 * 1000;

    // Check active entitlement for user & plan
    const activeList = await this.db.entitlements.find({
      userId,
      planId,
      status: 'active',
    });

    if (activeList.length > 0) {
      const existing = activeList[0]!;
      const entId = (existing as any).key || existing.id;
      const newExpireTime = Math.max(existing.expireTime, now) + durationMs;

      const newQuota = {
        apiCalls: (existing.quota?.apiCalls ?? 0) + (plan.quota?.apiCalls ?? 0),
        bandwidthBytes: (existing.quota?.bandwidthBytes ?? 0) + (plan.quota?.bandwidthBytes ?? 0),
      };

      existing.expireTime = newExpireTime;
      existing.quota = newQuota;
      if (orderId) existing.orderId = orderId;

      await this.db.entitlements.set(entId, existing, {
        keys: {
          token: existing.token,
          userId,
          planId,
          status: 'active',
          expireTime: newExpireTime,
        },
      });
      await this.db.entitlements.flush();

      return {
        id: entId,
        ...existing,
      };
    }

    // Provision new entitlement
    const entId = `ent_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const randomBytes = new Uint8Array(24);
    crypto.getRandomValues(randomBytes);
    const token =
      'goc_live_' +
      Array.from(randomBytes, (b) => b.toString(16).padStart(2, '0')).join('');
    const expireTime = now + durationMs;

    const entData: EntitlementData = {
      token,
      userId,
      planId,
      orderId: orderId || 'manual',
      status: 'active',
      startTime: now,
      expireTime,
      quota: {
        apiCalls: plan.quota?.apiCalls ?? 100000,
        bandwidthBytes: plan.quota?.bandwidthBytes ?? 10 * 1024 * 1024 * 1024,
      },
      usage: {
        usedCalls: 0,
        usedBandwidth: 0,
      },
      metadata: {
        planName: plan.name,
      },
    };

    await this.db.entitlements.set(entId, entData, {
      keys: {
        token,
        userId,
        planId,
        status: 'active',
        expireTime,
      },
    });
    await this.db.entitlements.flush();

    return {
      id: entId,
      ...entData,
    };
  }

  async getUserEntitlements(userId: string): Promise<Entitlement[]> {
    const list = await this.db.entitlements.find({ userId });
    const entitlements: Entitlement[] = list.map((item: any) => ({
      id: item.key || item.id,
      ...item,
    }));
    return entitlements.sort((a, b) => b.startTime - a.startTime);
  }

  async verifyEntitlementToken(token: string): Promise<VerifyTokenResult> {
    const record = await this.db.entitlements.getBy('token', token);
    if (!record) {
      return { valid: false, reason: 'NOT_FOUND' };
    }

    const entId = String(record.key);
    const ent: Entitlement = {
      id: entId,
      ...record,
    };

    if (ent.status === 'revoked') {
      return { valid: false, entitlement: ent, reason: 'REVOKED' };
    }

    const now = Date.now();
    if (now > ent.expireTime) {
      if (ent.status !== 'expired') {
        ent.status = 'expired';
        await this.db.entitlements.set(entId, ent, {
          keys: {
            token: ent.token,
            userId: ent.userId,
            planId: ent.planId,
            status: 'expired',
            expireTime: ent.expireTime,
          },
        });
        await this.db.entitlements.flush();
      }
      return { valid: false, entitlement: ent, reason: 'EXPIRED' };
    }

    if (ent.quota.apiCalls !== undefined && ent.usage.usedCalls >= ent.quota.apiCalls) {
      return { valid: false, entitlement: ent, reason: 'QUOTA_EXHAUSTED' };
    }

    return {
      valid: true,
      entitlement: ent,
    };
  }

  async recordUsage(
    token: string,
    calls = 1,
    bandwidthBytes = 0
  ): Promise<RecordUsageResult> {
    if (typeof calls !== 'number' || calls < 0 || !Number.isInteger(calls)) {
      throw new Error('calls must be a non-negative integer');
    }
    if (typeof bandwidthBytes !== 'number' || bandwidthBytes < 0 || !Number.isFinite(bandwidthBytes)) {
      throw new Error('bandwidthBytes must be a non-negative number');
    }

    const verification = await this.verifyEntitlementToken(token);
    if (!verification.valid || !verification.entitlement) {
      throw new Error(`Cannot record usage: ${verification.reason || 'Invalid token'}`);
    }

    const ent = verification.entitlement;
    const entId = ent.id;

    ent.usage.usedCalls += calls;
    ent.usage.usedBandwidth += bandwidthBytes;

    const callsExhausted =
      ent.quota.apiCalls !== undefined && ent.usage.usedCalls >= ent.quota.apiCalls;
    const bandwidthExhausted =
      ent.quota.bandwidthBytes !== undefined &&
      ent.usage.usedBandwidth >= ent.quota.bandwidthBytes;
    const exhausted = callsExhausted || bandwidthExhausted;

    await this.db.entitlements.set(entId, ent, {
      keys: {
        token: ent.token,
        userId: ent.userId,
        planId: ent.planId,
        status: ent.status,
        expireTime: ent.expireTime,
      },
    });
    await this.db.entitlements.flush();

    const remainingCalls =
      ent.quota.apiCalls !== undefined
        ? Math.max(0, ent.quota.apiCalls - ent.usage.usedCalls)
        : undefined;

    const remainingBandwidth =
      ent.quota.bandwidthBytes !== undefined
        ? Math.max(0, ent.quota.bandwidthBytes - ent.usage.usedBandwidth)
        : undefined;

    return {
      success: true,
      usedCalls: ent.usage.usedCalls,
      remainingCalls,
      usedBandwidth: ent.usage.usedBandwidth,
      remainingBandwidth,
      exhausted,
      entitlement: ent,
    };
  }
}
