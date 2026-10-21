# TASK-018: Landing Page & Pricing Matrix Elevation (Hero, Edge Architecture & Plan Cards)

## Objective
Elevate the landing page and pricing matrix (`HomeView.vue`, `PlanCard.vue`) according to `docs/Frontend-Design-Skill.md`. Transform the standard centered layout into an asymmetric, high-impact edge computing showcase featuring an interactive hero with live telemetry badges, subtle animated background spotlights, feature cards with gradient borders, and high-conversion pricing cards.

## Scope
- Hero Section Redesign:
  - Asymmetric composition with floating live telemetry pill (Sub-50ms Anycast, 100% Non-Custodial, D1 AutoBatch).
  - Editorial headline with gradient text and tight letter-spacing.
  - Interactive CTA with subtle glow and directional arrow hover state.
- Pricing Matrix & Plan Cards:
  - Interactive billing toggle with active pill slide animation and discount badges.
  - Plan cards (`PlanCard.vue`) with distinct tier visual hierarchy (Popular Pro card with ambient ring glow).
  - Price per day / monthly equivalent calculation breakdown.
  - Feature list with custom styled checkmarks and tooltips.
- Edge Architecture Feature Cards:
  - Distinct iconography with illuminated container backgrounds and gradient borders.

## Allowed Files
- `frontend/src/views/HomeView.vue`
- `frontend/src/components/plans/PlanCard.vue`
- `frontend/test/plans.test.ts`

## Dependencies
- `TASK-017` (Design System Elevation)

## Acceptance Criteria
- [x] Hero section features distinctive typography and telemetry status pill.
- [x] Billing period switch filters plans and displays discount badges cleanly.
- [x] Plan cards have distinctive tier styling with Pro tier ambient glow.
- [x] `pnpm --dir frontend test` passes without errors.
- [x] `pnpm --dir frontend build` compiles without errors.

## Verification Commands
```bash
pnpm --dir frontend test
pnpm --dir frontend build
```

## Status
DONE
