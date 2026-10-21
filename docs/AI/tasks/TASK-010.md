# TASK-010: Cloudflare Workers API Gateway, Routing & REST Controllers

## Objective
Implement the Cloudflare Workers router, request validation, authentication middleware, error handling, and complete REST API controllers for plans, user authentication, orders, verification, entitlement querying, and admin management.

## Scope
- Implement lightweight router / dispatcher in Cloudflare Worker `fetch` handler.
- Middleware:
  - CORS header handling with configurable origins.
  - JWT session authentication for protected routes (`/api/user/*`, `/api/orders/*`).
  - Admin RBAC middleware for `/api/admin/*`.
  - Structured JSON error handler and request logging.
- Controllers:
  - `GET /api/plans`: Public plans listing.
  - `POST /api/auth/login`: User login / session issuance.
  - `GET /api/user/profile`: User info and active entitlements summary.
  - `POST /api/orders`: Order creation endpoint (calls Pay3).
  - `GET /api/orders/:id`: Order status endpoint.
  - `POST /api/orders/:id/verify`: Instant payment verification endpoint.
  - `GET /api/user/entitlements`: User's active service entitlements and tokens.
  - `GET /api/admin/plans` & `POST /api/admin/plans`: Plan administration endpoints.
  - `GET /api/admin/orders`: Admin order audit and Pay3 diagnostic review.
  - `GET /healthz`: Health and storage readiness probe.
- Integration tests simulating HTTP requests against Worker endpoints.

## Allowed Files
- `src/index.ts`
- `src/router/router.ts`
- `src/controllers/auth.controller.ts`
- `src/controllers/plan.controller.ts`
- `src/controllers/order.controller.ts`
- `src/controllers/entitlement.controller.ts`
- `src/controllers/admin.controller.ts`
- `test/api.test.ts`

## Dependencies
- `TASK-004` (Auth Service)
- `TASK-006` (Order Service)
- `TASK-007` (Verification Engine)
- `TASK-009` (Entitlement Service)

## Inputs and Outputs
- **Inputs**: HTTP requests, Worker environment bindings (`env.DB`, `env.KV`, `env.JWT_SECRET`, etc.).
- **Outputs**: Standard JSON REST responses and structured error bodies.

## Acceptance Criteria
- [x] All defined endpoints respond accurately according to API contract in `docs/ARCHITECTURE.PROTAL.md`.
- [x] Unauthorized requests to protected routes return 401 Unauthorized.
- [x] Non-admin requests to `/api/admin/*` return 403 Forbidden.
- [x] CORS preflight OPTIONS requests are handled gracefully.
- [x] Integration tests pass in Vitest worker environment.

## Verification Commands
```bash
pnpm test test/api.test.ts
pnpm typecheck
```

## Risks and Assumptions
- Cloudflare Workers request context and bindings must be passed cleanly into controllers.

## Status
DONE

