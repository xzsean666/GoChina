import { TieredCache } from 'cloudflare-worker-kvdb';
import type { DatabaseClient } from '../db/client.js';
import type { Plan, PlanData } from '../types/models.js';
import type { CreatePlanInput, UpdatePlanInput } from '../types/plan.js';

export class PlanService {
  private cache: TieredCache;

  constructor(
    private db: DatabaseClient,
    cacheKv?: KVNamespace,
    ctx?: ExecutionContext
  ) {
    this.cache = new TieredCache({
      l1: { max: 200, defaultTTLMs: 60_000 },
      l2: cacheKv ? { namespace: cacheKv, prefix: 'goc_plans:' } : undefined,
      ctx,
    });
  }

  async createPlan(input: CreatePlanInput): Promise<Plan> {
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Plan name is required');
    }

    if (!input.priceUsd || !/^\d+(\.\d{1,2})?$/.test(input.priceUsd)) {
      throw new Error("Invalid price format; must be decimal string (e.g. '15.00')");
    }

    if (!input.durationDays || input.durationDays <= 0) {
      throw new Error('Duration days must be a positive integer');
    }

    const id =
      input.id ||
      `plan_${input.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now()}`;
    const category = input.category || 'standard';
    const enabled = input.enabled !== undefined ? input.enabled : 1;
    const sortOrder = input.sortOrder !== undefined ? input.sortOrder : 0;
    const tokenSymbol = input.tokenSymbol || 'USDT';
    const tokenAmount = input.tokenAmount || input.priceUsd;

    const planData: PlanData = {
      name: input.name,
      description: input.description || '',
      priceUsd: input.priceUsd,
      tokenAmount,
      tokenSymbol,
      durationDays: input.durationDays,
      features: input.features || [],
      quota: input.quota || {},
      category,
      enabled,
      sortOrder,
    };

    await this.db.plans.set(id, planData, {
      keys: {
        category,
        enabled,
        sortOrder,
      },
    });
    await this.db.plans.flush();
    await this.cache.clear();

    return {
      id,
      ...planData,
    };
  }

  async updatePlan(id: string, updates: UpdatePlanInput): Promise<Plan> {
    const existing = await this.db.plans.get(id);
    if (!existing) {
      throw new Error(`Plan '${id}' not found`);
    }

    if (updates.priceUsd !== undefined && !/^\d+(\.\d{1,2})?$/.test(updates.priceUsd)) {
      throw new Error("Invalid price format; must be decimal string (e.g. '15.00')");
    }

    if (updates.durationDays !== undefined && updates.durationDays <= 0) {
      throw new Error('Duration days must be a positive integer');
    }

    const merged: PlanData = {
      ...existing,
      ...updates,
      quota: {
        ...existing.quota,
        ...(updates.quota || {}),
      },
      features: updates.features ?? existing.features,
      tokenAmount: updates.tokenAmount ?? updates.priceUsd ?? existing.tokenAmount,
      category: updates.category ?? existing.category,
      enabled: updates.enabled !== undefined ? updates.enabled : existing.enabled,
      sortOrder: updates.sortOrder !== undefined ? updates.sortOrder : existing.sortOrder,
    };

    await this.db.plans.set(id, merged, {
      keys: {
        category: merged.category,
        enabled: merged.enabled,
        sortOrder: merged.sortOrder,
      },
    });
    await this.db.plans.flush();
    await this.cache.clear();

    return {
      id,
      ...merged,
    };
  }

  async getPlanById(id: string): Promise<Plan | null> {
    const data = await this.db.plans.get(id);
    if (!data) return null;
    return {
      id,
      ...data,
    };
  }

  async listActivePlans(category?: string): Promise<Plan[]> {
    const cacheKey = `active:${category || 'all'}`;
    return await this.cache.wrap<Plan[]>(
      cacheKey,
      async () => {
        const query = category ? { category, enabled: 1 } : { enabled: 1 };
        const rawList = await this.db.plans.find(query);
        const plans: Plan[] = rawList.map((item: any) => ({
          id: item.key || item.id,
          ...item,
        }));
        return plans.sort((a, b) => a.sortOrder - b.sortOrder);
      },
      { ttlMs: 60_000 }
    );
  }

  async listAllPlansAdmin(): Promise<Plan[]> {
    const rawList = await this.db.plans.find({});
    const plans: Plan[] = rawList.map((item: any) => ({
      id: item.key || item.id,
      ...item,
    }));
    return plans.sort((a, b) => a.sortOrder - b.sortOrder);
  }
}
