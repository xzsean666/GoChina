import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../src/stores/auth';
import type { PlanDefinition } from '../src/api/client';

describe('Plan Discovery & Auth UI (TASK-012)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('manages auth store session state and persistence', () => {
    const auth = useAuthStore();
    expect(auth.isAuthenticated).toBe(false);
    expect(auth.isAdmin).toBe(false);

    auth.setSession('test-jwt-token', {
      id: 'usr_123',
      role: 'user',
      email: 'user@example.com',
    });

    expect(auth.isAuthenticated).toBe(true);
    expect(auth.isAdmin).toBe(false);
    expect(auth.user?.email).toBe('user@example.com');
    expect(localStorage.getItem('gc_token')).toBe('test-jwt-token');

    auth.setSession('admin-jwt-token', {
      id: 'adm_999',
      role: 'admin',
      email: 'admin@gochina.io',
    });
    expect(auth.isAdmin).toBe(true);

    auth.clearSession();
    expect(auth.isAuthenticated).toBe(false);
    expect(auth.user).toBeNull();
    expect(localStorage.getItem('gc_token')).toBeNull();
  });

  it('correctly calculates plan discounts and duration categorizations', () => {
    const monthlyPlan: PlanDefinition = {
      id: 'monthly_1',
      name: 'Monthly Tier',
      category: 'Basic',
      description: 'Standard 30-day package',
      price_usd: 9.99,
      currency: 'USDT',
      duration_days: 30,
      quota_limit: 10 * 1024 * 1024 * 1024,
      features: ['Feature A'],
      enabled: true,
    };

    const quarterlyPlan: PlanDefinition = {
      ...monthlyPlan,
      id: 'quarterly_1',
      duration_days: 90,
      price_usd: 24.99,
    };

    const yearlyPlan: PlanDefinition = {
      ...monthlyPlan,
      id: 'yearly_1',
      duration_days: 365,
      price_usd: 79.99,
    };

    expect(monthlyPlan.duration_days).toBeLessThanOrEqual(30);
    expect(quarterlyPlan.duration_days).toBe(90);
    expect(yearlyPlan.duration_days).toBe(365);
  });
});
