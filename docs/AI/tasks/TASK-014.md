# TASK-014: Frontend User Dashboard & Entitlement Management UI

## Objective
Implement the authenticated user dashboard displaying active service entitlements, usage/quota progress bar, expiration countdown, entitlement credential display, and renewal controls.

## Scope
- User Dashboard Component (`DashboardView.vue`):
  - Fetches user profile and active entitlements from `GET /api/user/profile` and `GET /api/user/entitlements`.
  - Visual circular / linear progress bar displaying used vs total quota.
  - Expiration calendar indicator and days remaining counter.
  - Entitlement credentials management:
    - Masked display with "Show / Copy" toggle.
    - Scannable QR code of the entitlement access token.
    - "Reset Token" security button (calls backend to revoke and regenerate credentials).
  - Service renewal CTA redirecting to checkout.
- Unit tests validating quota calculation, countdown timers, and clipboard copy.

## Allowed Files
- `frontend/src/views/DashboardView.vue`
- `frontend/src/components/dashboard/QuotaGauge.vue`
- `frontend/src/components/dashboard/EntitlementCard.vue`
- `frontend/src/components/dashboard/TokenModal.vue`
- `frontend/test/dashboard.test.ts`

## Dependencies
- `TASK-010` (Workers API Gateway)
- `TASK-013` (Checkout Modal)

## Inputs and Outputs
- **Inputs**: User profile API (`/api/user/profile`), entitlement API (`/api/user/entitlements`).
- **Outputs**: Comprehensive, self-service user management dashboard.

## Acceptance Criteria
- [x] Correctly computes and visualizes remaining quota and validity days.
- [x] Displays masked entitlement tokens with secure copy and reset actions.
- [x] Component unit tests pass.

## Verification Commands
```bash
cd frontend && pnpm test
cd frontend && pnpm build
```

## Risks and Assumptions
- Clipboard copy API requires fallback for non-secure contexts.

## Status
DONE
