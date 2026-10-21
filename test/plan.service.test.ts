import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase, type DatabaseClient } from '../src/db/client.js';
import { seedDatabase } from '../src/db/seed.js';
import { PlanService } from '../src/services/plan.js';
import { createMockEnv, createMockExecutionContext } from './setup.js';

describe('PlanService & Service Catalog (TASK-008)', () => {
  let db: DatabaseClient;
  let planService: PlanService;
  let mockEnv: ReturnType<typeof createMockEnv>;

  beforeEach(async () => {
    mockEnv = createMockEnv();
    const ctx = createMockExecutionContext();
    db = createDatabase(mockEnv, ctx);
    await db.init();
    await seedDatabase(db);

    planService = new PlanService(db, mockEnv.CACHE_KV, ctx);
  });

  describe('Plan Creation & Validation', () => {
    it('creates a new plan with valid parameters', async () => {
      const plan = await planService.createPlan({
        name: 'Developer Sandbox',
        description: 'Free trial tier for evaluation',
        priceUsd: '0.00',
        durationDays: 14,
        features: ['1,000 API calls', '1 seat'],
        category: 'developer',
        sortOrder: 10,
      });

      expect(plan.id).toBeDefined();
      expect(plan.name).toBe('Developer Sandbox');
      expect(plan.priceUsd).toBe('0.00');
      expect(plan.tokenAmount).toBe('0.00');
      expect(plan.enabled).toBe(1);

      const saved = await planService.getPlanById(plan.id);
      expect(saved).not.toBeNull();
      expect(saved?.id).toBe(plan.id);
    });

    it('rejects plan creation with invalid price or duration', async () => {
      await expect(
        planService.createPlan({
          name: 'Invalid Price',
          description: '',
          priceUsd: 'not_a_number',
          durationDays: 30,
          features: [],
        })
      ).rejects.toThrow("Invalid price format; must be decimal string (e.g. '15.00')");

      await expect(
        planService.createPlan({
          name: 'Invalid Duration',
          description: '',
          priceUsd: '10.00',
          durationDays: -5,
          features: [],
        })
      ).rejects.toThrow('Duration days must be a positive integer');

      await expect(
        planService.createPlan({
          name: '',
          description: '',
          priceUsd: '10.00',
          durationDays: 30,
          features: [],
        })
      ).rejects.toThrow('Plan name is required');
    });
  });

  describe('Plan Updates', () => {
    it('updates existing plan properties and invalidates cache', async () => {
      const updated = await planService.updatePlan('plan_starter_monthly', {
        priceUsd: '19.99',
        description: 'Updated starter monthly description',
        enabled: 1,
      });

      expect(updated.priceUsd).toBe('19.99');
      expect(updated.description).toBe('Updated starter monthly description');

      const reloaded = await planService.getPlanById('plan_starter_monthly');
      expect(reloaded?.priceUsd).toBe('19.99');
    });

    it('rejects update for non-existent plan', async () => {
      await expect(
        planService.updatePlan('plan_does_not_exist', { priceUsd: '99.00' })
      ).rejects.toThrow("Plan 'plan_does_not_exist' not found");
    });
  });

  describe('Plan Querying & Cache Acceleration', () => {
    it('lists only active enabled plans sorted by sortOrder', async () => {
      // Disable pro plan
      await planService.updatePlan('plan_pro_monthly', { enabled: 0 });

      const activePlans = await planService.listActivePlans();
      const planIds = activePlans.map((p) => p.id);

      expect(planIds).toContain('plan_starter_monthly');
      expect(planIds).toContain('plan_enterprise_yearly');
      expect(planIds).not.toContain('plan_pro_monthly');

      // Verify sorting
      for (let i = 0; i < activePlans.length - 1; i++) {
        expect(activePlans[i]!.sortOrder).toBeLessThanOrEqual(activePlans[i + 1]!.sortOrder);
      }
    });

    it('filters active plans by category', async () => {
      const standardPlans = await planService.listActivePlans('standard');
      expect(standardPlans.length).toBeGreaterThan(0);
      for (const p of standardPlans) {
        expect(p.category).toBe('standard');
      }
    });

    it('allows admin to list all plans including disabled ones', async () => {
      await planService.updatePlan('plan_starter_monthly', { enabled: 0 });

      const allPlans = await planService.listAllPlansAdmin();
      const disabledPlan = allPlans.find((p) => p.id === 'plan_starter_monthly');
      expect(disabledPlan).toBeDefined();
      expect(disabledPlan?.enabled).toBe(0);
    });
  });
});
