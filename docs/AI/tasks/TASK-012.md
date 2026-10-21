# TASK-012: Frontend Plan Discovery & User Authentication UI

## Objective
Implement the public service and plan showcase cards, feature comparison matrix, and user authentication modal (email OTP login and Web3 wallet sign-in) connected to the backend API.

## Scope
- Plan Showcase Components:
  - `PlanCards`: Renders available plans fetched from `GET /api/plans`.
  - Monthly / Quarterly / Yearly toggle with discount badges.
  - Feature checklist (service entitlements, duration, quota limits).
  - "Subscribe Now" CTA button triggering login or checkout.
- Authentication Modal:
  - Email input with countdown OTP button.
  - Verification code input with auto-submit.
  - Web3 wallet connect alternative (MetaMask / injected provider).
  - Session state persistence in `localStorage` with reactive user profile store.
- Component unit and story tests.

## Allowed Files
- `frontend/src/views/HomeView.vue`
- `frontend/src/components/plans/PlanCard.vue`
- `frontend/src/components/auth/AuthModal.vue`
- `frontend/src/stores/auth.ts`
- `frontend/src/api/client.ts`
- `frontend/test/plans.test.ts`

## Dependencies
- `TASK-010` (Workers API Gateway)
- `TASK-011` (Frontend Scaffolding)

## Inputs and Outputs
- **Inputs**: Plans API (`/api/plans`), Auth API (`/api/auth/*`).
- **Outputs**: Interactive plan selection and working authentication flow.

## Acceptance Criteria
- [x] Successfully fetches and displays plans from backend API.
- [x] User can request OTP, enter verification code, and obtain valid user session.
- [x] Logged-in state is reactively reflected in the navigation bar.

## Verification Commands
```bash
cd frontend && pnpm build
cd frontend && pnpm test
```

## Risks and Assumptions
- Mock API fallbacks should be provided during local frontend standalone development.

## Status
DONE
