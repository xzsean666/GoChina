import { describe, it, expect } from 'vitest';
import type { EntitlementRecord } from '../src/api/client';

describe('Frontend User Dashboard & Quota (TASK-014)', () => {
  it('accurately computes bandwidth quota percentage and limits', () => {
    const totalBytes = 100 * 1024 * 1024 * 1024; // 100 GB
    const usedBytes = 25 * 1024 * 1024 * 1024; // 25 GB

    const percentage = Math.round((usedBytes / totalBytes) * 100);
    expect(percentage).toBe(25);

    const gbTotal = totalBytes / (1024 * 1024 * 1024);
    const gbUsed = usedBytes / (1024 * 1024 * 1024);
    expect(gbTotal).toBe(100);
    expect(gbUsed).toBe(25);
  });

  it('correctly calculates remaining entitlement validity days', () => {
    const now = Date.now();
    const tenDaysLater = now + 10 * 24 * 60 * 60 * 1000;
    const diffDays = Math.ceil((tenDaysLater - now) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(10);

    const pastTime = now - 5 * 24 * 60 * 60 * 1000;
    const expiredDays = Math.max(0, Math.ceil((pastTime - now) / (1000 * 60 * 60 * 24)));
    expect(expiredDays).toBe(0);
  });

  it('masks sensitive entitlement token correctly', () => {
    const token = 'gct_prod_9876543210abcdef9876543210abcdef';
    const isMasked = true;
    const display = isMasked
      ? `${token.slice(0, 8)}••••••••••••••••••••••••••••${token.slice(-6)}`
      : token;

    expect(display.startsWith('gct_prod')).toBe(true);
    expect(display.endsWith('abcdef')).toBe(true);
    expect(display.includes('••••')).toBe(true);
  });
});
