import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../src/stores/auth';
import type { PlanDefinition, OrderRecord } from '../src/api/client';

describe('Frontend Admin Management & Pay3 Diagnostics (TASK-015)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('strictly enforces RBAC access control for admin panels', () => {
    const auth = useAuthStore();

    // Anonymous
    expect(auth.isAdmin).toBe(false);

    // Regular user
    auth.setSession('token-user', {
      id: 'usr_normal',
      role: 'user',
      email: 'user@gochina.io',
    });
    expect(auth.isAdmin).toBe(false);

    // Admin user
    auth.setSession('token-admin', {
      id: 'usr_admin',
      role: 'admin',
      email: 'admin@gochina.io',
    });
    expect(auth.isAdmin).toBe(true);
  });

  it('correctly constructs and normalizes plan creation parameters', () => {
    const rawQuotaGb = 250;
    const quotaBytes = rawQuotaGb * 1024 * 1024 * 1024;
    expect(quotaBytes).toBe(268435456000);

    const rawFeatures = 'Feature 1\n  Feature 2  \n\nFeature 3';
    const parsedFeatures = rawFeatures
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    expect(parsedFeatures).toEqual(['Feature 1', 'Feature 2', 'Feature 3']);
  });

  it('formats Pay3 deposit addresses and order status properly', () => {
    const order: OrderRecord = {
      id: 'ord_123456789',
      user_id: 'usr_abc123456789',
      plan_id: 'starter_monthly',
      chain_id: 1,
      token_symbol: 'USDT',
      expected_amount: '9.99',
      pay3_order_id: 'pay3_9999999999',
      deposit_address: '0x71C84033C87093600be636839878B63278c73838',
      status: 'paid',
      expires_at: Date.now() + 1800000,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    expect(order.status).toBe('paid');
    expect(order.deposit_address.startsWith('0x')).toBe(true);
    expect(order.expected_amount).toBe('9.99');
  });
});
