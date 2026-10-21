# TASK-007: Dual Verification Engine (Instant Verify Handler & Scheduled Cron Sweeper Worker)

## Objective
Implement the dual-channel payment verification and entitlement fulfillment engine: (1) user-triggered instant RPC verification (`POST /api/orders/:id/verify`), and (2) Cloudflare Workers `scheduled` cron background sweeper querying pending orders from `cloudflare-worker-kvdb` to poll Pay3 and auto-fulfill entitlements.

## Scope
- Implement `VerificationService`:
  - `verifyOrderInstant(orderId: string, userId: string)`:
    - Validate order ownership and pending state from `ordersTable`.
    - Call `Pay3Client.verifyOrder(pay3OrderId)` triggering immediate direct RPC log scan in Pay3.
    - If status transitioned to `paid`: update order in `ordersTable`, set `paid_at`, and invoke `EntitlementService.provisionOrExtendEntitlement()`.
    - If Pay3 diagnostics report `late_payment`: mark order as `late_payment` for audit inspection.
    - Return updated order status and activation info.
  - `sweepPendingOrders()`:
    - Query active pending orders using KVDB `ordersTable.find({ status: "pending" })` (leveraging B-Tree physical index).
    - Poll Pay3 `getOrder` or `verifyOrder` in safe micro-batches (<=20).
    - Automatically activate entitlements for newly confirmed payments.
    - Transition orders past `expires_at` without payment to `expired`.
- Unit tests validating instant verification, cron sweeping, and late/partial payment edge cases.

## Allowed Files
- `src/services/verification.ts`
- `src/cron/sweeper.ts`
- `test/verification.service.test.ts`
- `test/cron.sweeper.test.ts`

## Dependencies
- `TASK-006` (Order Lifecycle Service)

## Inputs and Outputs
- **Inputs**: User verify requests, Cloudflare scheduled cron events (`* * * * *`), KVDB `orders` table.
- **Outputs**: Auto-activated entitlements and updated order statuses in KVDB.

## Acceptance Criteria
- [x] Instant verify endpoint calls Pay3 and immediately transitions order and entitlement upon payment confirmation.
- [x] Background sweeper queries pending orders via KVDB physical index and marks expired orders accurately.
- [x] Diagnostics from Pay3 (`late_payment_count`, `problem_payment_count`) are preserved in order metadata.
- [x] 100% unit test coverage for verify and sweeper logic with mock Pay3 server.

## Verification Commands
```bash
pnpm test test/verification.service.test.ts test/cron.sweeper.test.ts
pnpm typecheck
```

## Risks and Assumptions
- Cloudflare Workers scheduled events execute in the background with limited CPU time; sweep batch size must be bounded.

## Status
DONE

