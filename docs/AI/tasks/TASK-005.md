# TASK-005: Pay3 Integration Client, Scope JWT Provider & Mock Test Harness

## Objective
Implement an edge-compatible TypeScript HTTP client for the `pay3` payment gateway, including scoped JWT generation via `jose`, typed error models, network retry policies, and an offline mock test harness.

## Scope
- Implement `Pay3Client` class adhering strictly to `/ssd0/git/pay3/docs/AI/SKILL.md`.
- Implement HS256 JWT generation supporting fine-grained scopes: `orders:create`, `orders:read`, `orders:verify`.
- Implement client methods:
  - `createOrder({ externalId, amount, ttlSeconds, metadata })`
  - `getOrder(orderId: string)`
  - `getOrderByExternalId(externalId: string)`
  - `verifyOrder(orderId: string)`
- Implement typed error handling (`Pay3ApiError`) parsing Pay3's error payload `{ code, message, retryable }`.
- Build a lightweight `MockPay3Server` in Vitest for deterministic offline testing.

## Allowed Files
- `src/pay3/client.ts`
- `src/pay3/types.ts`
- `src/pay3/jwt.ts`
- `src/pay3/errors.ts`
- `test/mocks/pay3.mock.ts`
- `test/pay3.test.ts`

## Dependencies
- `TASK-002` (Project Scaffolding)

## Inputs and Outputs
- **Inputs**: Pay3 REST API contract and `/ssd0/git/pay3/docs/AI/SKILL.md`.
- **Outputs**: Robust, fully tested `Pay3Client` and mock harness.

## Acceptance Criteria
- [x] `Pay3Client` successfully signs valid JWT tokens matching Pay3 claims format (`iss`, `aud`, `sub`, `scope`).
- [x] Handles 201 Created and 200 OK idempotent responses correctly.
- [x] Correctly parses `payment` object containing `receive_address`, `expires_at`, `amount_raw`.
- [x] 100% test coverage for client methods with mock fetch.

## Verification Commands
```bash
pnpm test test/pay3.test.ts
pnpm typecheck
```

## Risks and Assumptions
- Pay3 API URL, JWT secret, and issuer are injected via Cloudflare Worker environment variables.

## Status
DONE

