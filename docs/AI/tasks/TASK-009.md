# TASK-009: Entitlement Fulfillment Engine & Usage Tracking Service

## Objective
Implement `EntitlementService` for digital service entitlement fulfillment upon order confirmation, duration extension, quota tracking, and secure high-entropy entitlement token generation, utilizing `cloudflare-worker-kvdb` `entitlements` Multi-Key table with Auto-Batching and O(1) token lookups.

## Scope
- Implement `EntitlementService`:
  - `provisionOrExtendEntitlement(userId: string, planId: string)`:
    - Query active entitlement for user via KVDB composite index: `entitlementsTable.find({ userId, status: "active" })`.
    - If active: extend `expireTime` by plan `duration_days` and increment `quota_limit`.
    - If new: generate cryptographically secure `entitlement_token` (NanoID/hex), set initial validity period and quota, and create record via `entitlementsTable.set(id, entitlementData, { keys: { token, userId, planId, status: "active", expireTime } })`.
  - `getUserEntitlements(userId: string)`:
    - Retrieve all active and past entitlements for user via `entitlementsTable.find({ userId })`.
  - `verifyEntitlementToken(token: string)`:
    - O(1) lookup via `entitlementsTable.getBy("token", token)`.
    - Validate token authenticity, active status, and non-expired state.
  - `recordUsage(token: string, amount: number)`:
    - Deduct/record quota usage atomically and update status to `exhausted` if limit is reached.
- Comprehensive unit tests for entitlement provisioning, extension, and quota tracking.

## Allowed Files
- `src/services/entitlement.ts`
- `src/types/entitlement.ts`
- `test/entitlement.service.test.ts`

## Dependencies
- `TASK-003` (Domain Models & KVDB)
- `TASK-008` (Plan Service)

## Inputs and Outputs
- **Inputs**: User ID, plan details, usage amounts, KVDB `entitlements` table.
- **Outputs**: Created/updated entitlement records and verified entitlement tokens.

## Acceptance Criteria
- [x] Correctly provisions new entitlements or extends existing active periods upon fulfillment.
- [x] Generates unique, unguessable `entitlement_token` with O(1) lookup via `getBy("token", token)`.
- [x] Atomically tracks quota usage and rejects operations when quota is exhausted.
- [x] Unit tests pass with 100% coverage on fulfillment and renewal scenarios.

## Verification Commands
```bash
pnpm test test/entitlement.service.test.ts
pnpm typecheck
```

## Risks and Assumptions
- Entitlement provisioning must be idempotent and tied to verified order state.

## Status
DONE

