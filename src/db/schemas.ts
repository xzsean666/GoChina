import type { MultiKeySchema } from 'cloudflare-worker-kvdb';
import type {
  UserKeys,
  PlanKeys,
  OrderKeys,
  EntitlementKeys,
  TalentKeys,
  InquiryKeys,
  ContractKeys,
} from '../types/models.js';

export const userSchema: MultiKeySchema<UserKeys, 'string'> = {
  primaryKey: { name: 'id', type: 'string' },
  keys: {
    email: { type: 'string', index: { unique: true } },
    walletAddress: { type: 'string', nullable: true, index: true },
    role: { type: 'string', default: 'user', index: true },
    status: { type: 'string', default: 'active', index: true },
  },
};

export const planSchema: MultiKeySchema<PlanKeys, 'string'> = {
  primaryKey: { name: 'id', type: 'string' },
  keys: {
    category: { type: 'string', default: 'standard', index: true },
    enabled: { type: 'integer', default: 1, index: true },
    sortOrder: { type: 'integer', default: 0, index: true },
  },
};

export const orderSchema: MultiKeySchema<OrderKeys, 'string'> = {
  primaryKey: { name: 'id', type: 'string' },
  keys: {
    externalId: { type: 'string', index: { unique: true } },
    pay3OrderId: { type: 'string', index: true },
    userId: { type: 'string', index: true },
    status: { type: 'string', default: 'pending', index: true },
    receiveAddress: { type: 'string', index: true },
  },
  indexes: [
    { name: 'idx_user_status', keys: ['userId', 'status'] },
  ],
};

export const entitlementSchema: MultiKeySchema<EntitlementKeys, 'string'> = {
  primaryKey: { name: 'id', type: 'string' },
  keys: {
    token: { type: 'string', index: { unique: true } },
    userId: { type: 'string', index: true },
    planId: { type: 'string', index: true },
    status: { type: 'string', default: 'active', index: true },
    expireTime: { type: 'integer', index: true },
  },
  indexes: [
    { name: 'idx_user_status', keys: ['userId', 'status'] },
  ],
};

export const talentSchema: MultiKeySchema<TalentKeys, 'string'> = {
  primaryKey: { name: 'id', type: 'string' },
  keys: {
    category: { type: 'string', default: 'sourcing', index: true },
    status: { type: 'string', default: 'active', index: true },
    sortOrder: { type: 'integer', default: 0, index: true },
  },
};

export const inquirySchema: MultiKeySchema<InquiryKeys, 'string'> = {
  primaryKey: { name: 'id', type: 'string' },
  keys: {
    userId: { type: 'string', index: true },
    status: { type: 'string', default: 'pending', index: true },
    category: { type: 'string', default: 'sourcing', index: true },
  },
  indexes: [
    { name: 'idx_inquiry_user_status', keys: ['userId', 'status'] },
  ],
};

export const contractSchema: MultiKeySchema<ContractKeys, 'string'> = {
  primaryKey: { name: 'id', type: 'string' },
  keys: {
    userId: { type: 'string', index: true },
    talentId: { type: 'string', index: true },
    status: { type: 'string', default: 'draft', index: true },
    contractNo: { type: 'string', index: { unique: true } },
    orderId: { type: 'string', nullable: true, index: true },
  },
  indexes: [
    { name: 'idx_contract_user_status', keys: ['userId', 'status'] },
  ],
};
