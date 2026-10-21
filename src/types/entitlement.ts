import type { Entitlement } from './models.js';

export interface VerifyTokenResult {
  valid: boolean;
  entitlement?: Entitlement;
  reason?: 'NOT_FOUND' | 'EXPIRED' | 'REVOKED' | 'QUOTA_EXHAUSTED';
}

export interface RecordUsageResult {
  success: boolean;
  usedCalls: number;
  remainingCalls?: number;
  usedBandwidth: number;
  remainingBandwidth?: number;
  exhausted: boolean;
  entitlement: Entitlement;
}
