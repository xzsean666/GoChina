# TASK-006: Order Lifecycle, Checkout Flow & Idempotent Pay3 Linkage

## Objective
Implement `OrderService` encapsulating business logic for creating checkout orders, coordinating with `Pay3Client` to allocate child deposit addresses, persisting order records in `cloudflare-worker-kvdb` `orders` table with Auto-Batching, and managing status transitions.

## Scope
- Implement `OrderService`:
  - `createCheckoutOrder(userId: string, planId: string)`:
    - O(1) plan lookup via `plansTable.get(planId)`.
    - Generate unique, deterministic business `externalId` (`ord_gochina_<timestamp>_<nanoid>`).
    - Call `Pay3Client.createOrder()` with `external_id`, `amount`, `ttl_seconds: 3600` to obtain unique child deposit address, token symbol (USDT), chain ID, and expiry.
    - Persist order record in `ordersTable.set(orderId, orderData, { keys: { externalId, pay3OrderId, userId, status: "pending", receiveAddress } })`.
  - `getOrderDetails(orderId: string, userId: string)`:
    - O(1) order lookup with user ownership validation.
  - `getOrderByExternalId(externalId: string)`:
    - O(1) query via `ordersTable.getBy("externalId", externalId)`.
  - `getUserOrders(userId: string, cursor?: string, limit?: number)`:
    - Fast Keyset cursor pagination via `ordersTable.findPage({ userId }, { cursor, limit })`.
  - `updateOrderStatus(orderId: string, status: OrderStatus, paidAt?: string)`.
- Unit tests validating order creation, Pay3 linkage, idempotency, and status updates.

## Allowed Files
- `src/services/order.ts`
- `src/services/types.ts`
- `test/order.service.test.ts`

## Dependencies
- `TASK-003` (Domain Models & KVDB)
- `TASK-005` (Pay3 Client)

## Inputs and Outputs
- **Inputs**: User ID, plan ID, `Pay3Client`, and `DatabaseContext`.
- **Outputs**: Created order record with deposit address, QR code payload, and expiration timestamp.

## Acceptance Criteria
- [x] Successfully creates order and persists in KVDB `orders` table with status `pending`.
- [x] Correctly links `pay3_order_id`, `receive_address`, and `external_id`.
- [x] `ordersTable.getBy("externalId", externalId)` provides O(1) lookup.
- [x] Preserves idempotency when user re-requests checkout for the same pending order.
- [x] Unit tests pass for successful checkout and invalid plan rejection.

## Verification Commands
```bash
pnpm test test/order.service.test.ts
pnpm typecheck
```

## Risks and Assumptions
- Network timeouts when contacting Pay3 must be handled gracefully without leaving orphan states.

## Status
DONE

