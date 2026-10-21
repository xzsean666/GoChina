# TASK-008: Service Catalog & Plan Management Service

## Objective
Implement `PlanService` for managing service catalog offerings, plan configurations (pricing in USD, categories, duration, quota limits, features), plan visibility filtering, and administrator CRUD operations, backed by `cloudflare-worker-kvdb` `plans` table with TieredCache (L1 memory + L2 Workers KV).

## Scope
- Implement `PlanService`:
  - `createPlan(input: CreatePlanInput)`:
    - Validates plan name, category, price, duration, and feature breakdown.
    - Persists to `plansTable.set(id, planData, { keys: { category, enabled: 1, sortOrder } })`.
  - `updatePlan(id: string, updates: Partial<Plan>)`.
  - `listActivePlans(category?: string)`:
    - Queries plans where `enabled = 1`, sorted by `sortOrder`.
    - Leverages KVDB TieredCache (L1 Memory LRU + L2 Workers KV) for sub-millisecond edge responses.
  - `getPlanById(id: string)`: O(1) primary key lookup.
  - `listAllPlansAdmin()`:
    - Admin query of all plans including disabled/draft ones.
- Unit tests verifying plan creation, price validation, category filtering, and cache eviction.

## Allowed Files
- `src/services/plan.ts`
- `src/types/plan.ts`
- `test/plan.service.test.ts`

## Dependencies
- `TASK-003` (Domain Models & KVDB)

## Inputs and Outputs
- **Inputs**: Plan inputs, admin updates, KVDB `plans` table.
- **Outputs**: Validated plan entities and cached plan listings.

## Acceptance Criteria
- [x] Strictly validates price strings (e.g. `"9.90"` decimal text) and duration days.
- [x] Active plans listing returns only enabled plans sorted by `sortOrder`.
- [x] KVDB TieredCache accelerates repeated queries with sub-millisecond response.
- [x] Unit tests pass for plan creation, category filtering, and update flows.

## Verification Commands
```bash
pnpm test test/plan.service.test.ts
pnpm typecheck
```

## Risks and Assumptions
- Price must be formatted as precise decimal strings to prevent floating-point discrepancies.

## Status
DONE

