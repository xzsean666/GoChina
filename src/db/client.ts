import { KVDB, type Table } from 'cloudflare-worker-kvdb';
import {
  userSchema,
  planSchema,
  orderSchema,
  entitlementSchema,
  talentSchema,
  inquirySchema,
  contractSchema,
} from './schemas.js';
import type {
  UserData, UserKeys,
  PlanData, PlanKeys,
  OrderData, OrderKeys,
  EntitlementData, EntitlementKeys,
  TalentData, TalentKeys,
  InquiryData, InquiryKeys,
  ContractData, ContractKeys,
} from '../types/models.js';

export interface DatabaseClient {
  kvdb: KVDB;
  users: Table<UserData, UserKeys>;
  plans: Table<PlanData, PlanKeys>;
  orders: Table<OrderData, OrderKeys>;
  entitlements: Table<EntitlementData, EntitlementKeys>;
  talents: Table<TalentData, TalentKeys>;
  inquiries: Table<InquiryData, InquiryKeys>;
  contracts: Table<ContractData, ContractKeys>;
  init(): Promise<void>;
  flushAll(): Promise<void>;
}

export function createDatabase(
  env: { DB: D1Database; CACHE_KV?: KVNamespace },
  ctx?: ExecutionContext
): DatabaseClient {
  const kvdb = new KVDB({
    d1: env.DB,
    kv: env.CACHE_KV,
    ctx,
    autoBatch: {
      maxBatchSize: 50,
      maxWaitMs: 50,
    },
  });

  const users = kvdb.table<UserData, UserKeys>('users', {
    schema: userSchema,
    autoBatch: { maxBatchSize: 50, maxWaitMs: 50 },
    ctx,
  });

  const plans = kvdb.table<PlanData, PlanKeys>('plans', {
    schema: planSchema,
    autoBatch: { maxBatchSize: 50, maxWaitMs: 50 },
    ctx,
  });

  const orders = kvdb.table<OrderData, OrderKeys>('orders', {
    schema: orderSchema,
    autoBatch: { maxBatchSize: 50, maxWaitMs: 50 },
    ctx,
  });

  const entitlements = kvdb.table<EntitlementData, EntitlementKeys>('entitlements', {
    schema: entitlementSchema,
    autoBatch: { maxBatchSize: 50, maxWaitMs: 50 },
    ctx,
  });

  const talents = kvdb.table<TalentData, TalentKeys>('talents', {
    schema: talentSchema,
    autoBatch: { maxBatchSize: 50, maxWaitMs: 50 },
    ctx,
  });

  const inquiries = kvdb.table<InquiryData, InquiryKeys>('inquiries', {
    schema: inquirySchema,
    autoBatch: { maxBatchSize: 50, maxWaitMs: 50 },
    ctx,
  });

  const contracts = kvdb.table<ContractData, ContractKeys>('contracts', {
    schema: contractSchema,
    autoBatch: { maxBatchSize: 50, maxWaitMs: 50 },
    ctx,
  });

  return {
    kvdb,
    users,
    plans,
    orders,
    entitlements,
    talents,
    inquiries,
    contracts,
    async init() {
      await users.init();
      await plans.init();
      await orders.init();
      await entitlements.init();
      await talents.init();
      await inquiries.init();
      await contracts.init();
    },
    async flushAll() {
      await Promise.all([
        users.flush(),
        plans.flush(),
        orders.flush(),
        entitlements.flush(),
        talents.flush(),
        inquiries.flush(),
        contracts.flush(),
      ]);
    },
  };
}
