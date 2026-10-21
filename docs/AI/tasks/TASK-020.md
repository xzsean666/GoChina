# TASK-020: User Dashboard & Admin Management Panel Visual Elevation

## Objective
Elevate the user dashboard (`DashboardView.vue`, `EntitlementCard.vue`, `QuotaGauge.vue`, `TokenModal.vue`) and administrator management panel (`AdminView.vue`, `PlanTable.vue`, `OrderAuditTable.vue`, `PlanModal.vue`) into high-density, professional production dashboards in compliance with `docs/Frontend-Design-Skill.md`.

## Scope
- User Dashboard Elevation:
  - Metric stat widgets (Active Subscriptions, Bandwidth Consumed, Days Remaining, Security Token).
  - High-precision SVG circular and linear bandwidth quota gauges with gradient fills and clear units.
  - Entitlement cards with monospace token mask, quick copy, and expiration status badges.
  - Interactive token inspection modal with QR export and masked reveal.
- Admin Panel Elevation:
  - Clean high-density telemetry header (Total Volume, Active Plans, Pay3 Sweeper Health).
  - Modernized plan management table and audit log with status pills and quick actions.
  - Modal form styling with clear field grouping and focus rings.

## Allowed Files
- `frontend/src/views/DashboardView.vue`
- `frontend/src/views/AdminView.vue`
- `frontend/src/components/dashboard/*`
- `frontend/src/components/admin/*`
- `frontend/test/dashboard.test.ts`
- `frontend/test/admin.test.ts`

## Dependencies
- `TASK-017` (Design System Elevation)

## Acceptance Criteria
- [x] Dashboard displays quota gauge, subscription cards, and credentials modal with elevated aesthetics.
- [x] Admin panel displays operational statistics and refined tables.
- [x] `pnpm --dir frontend test` passes without errors.
- [x] `pnpm --dir frontend build` compiles without errors.

## Verification Commands
```bash
pnpm --dir frontend test
pnpm --dir frontend build
```

## Status
DONE
