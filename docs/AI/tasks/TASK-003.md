# TASK-003: Domain Data Models, MultiKeySchema Definitions & `cloudflare-worker-kvdb` Client

## Objective
Implement strongly-typed TypeScript domain models and initialize the database layer using `cloudflare-worker-kvdb` with `MultiKeySchema` declarative physical B-Tree indexing, Auto-Batch write coalescing, and L1/L2 Tiered Cache for `users`, `plans`, `orders`, and `entitlements`.

## Scope
- Define TypeScript domain entity types: `User`, `Plan`, `Order`, `Entitlement`.
- Implement `MultiKeySchema` table declarations:
  - `users`: Primary key `id`. Physical keys: `email` (unique index), `walletAddress` (index), `role` (index), `status` (index).
  - `plans`: Primary key `id`. Physical keys: `category` (index), `enabled` (index), `sortOrder` (index).
  - `orders`: Primary key `id`. Physical keys: `externalId` (unique index), `pay3OrderId` (index), `userId` (index), `status` (index), `receiveAddress` (index). Composite index: `idx_user_status` (`["userId", "status"]`).
  - `entitlements`: Primary key `id`. Physical keys: `token` (unique index), `userId` (index), `planId` (index), `status` (index), `expireTime` (index). Composite index: `idx_user_status`.
- Implement `createDatabase(env, ctx)` factory:
  - Configures `KVDB` with D1 (`env.DB`), KV (`env.KV`), and `autoBatch: { maxBatchSize: 50, flushIntervalMs: 50 }`.
  - Exposes typed table facades: `db.table<UserData, UserKeys>("users", { schema: userSchema })`.
- Seed routine populating starter service plans via KVDB `plansTable.set()`.
- Unit tests verifying table registration, `table.set()`, `table.getBy()` O(1) secondary point lookups, and `table.findPage()` Keyset pagination.

## Allowed Files
- `src/types/models.ts`
- `src/db/schemas.ts`
- `src/db/client.ts`
- `src/db/seed.ts`
- `test/db.test.ts`

## Dependencies
- `TASK-002` (Project Scaffolding & Test Harness)

## Inputs and Outputs
- **Inputs**: Multi-key schema specifications from `docs/ARCHITECTURE.PROTAL.md` and `cloudflare-worker-kvdb` SDK skill.
- **Outputs**: Strongly-typed KVDB client, declarative schemas, seed utility, and comprehensive unit tests.

## Acceptance Criteria
- [x] Schema table definitions compile cleanly with `cloudflare-worker-kvdb`.
- [x] Multi-Key physical secondary columns and B-Tree indexes are created automatically by KVDB.
- [x] `table.getBy()` executes O(1) point lookups for unique keys (`email`, `externalId`, `token`).
- [x] `table.findPage()` performs Keyset cursor pagination without `OFFSET` penalties.
- [x] Auto-batching buffer flushes successfully.
- [x] Unit tests pass with 100% coverage on schema operations.

## Verification Commands
```bash
pnpm test test/db.test.ts
pnpm typecheck
```

## Risks and Assumptions
- Cloudflare D1 100-parameter limit is safely handled by KVDB's internal parameter chunker.

## Status
DONE

