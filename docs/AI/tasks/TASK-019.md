# TASK-019: Web3 Crypto Checkout & Auth Modal Visual Overhaul

## Objective
Elevate the core payment checkout experience (`CheckoutModal.vue`) and user authentication modal (`AuthModal.vue`) into a production-grade Web3 experience following `docs/Frontend-Design-Skill.md`. Create a sleek crypto cashier with scanner reticle frames, live countdown ring/progress, real-time transaction detection pulse, and intuitive copy micro-interactions.

## Scope
- Checkout Modal Redesign:
  - Custom QR code container with subtle corner scan reticles and high-contrast display.
  - Formatted Pay3 HD deposit address with monospace typography, one-click copy with tooltip feedback.
  - Dynamic countdown timer with animated urgency colors (amber when < 5 mins).
  - Live chain scanner heartbeat indicator ("Listening for ERC20 transfer...").
  - Primary verification button with animated spinner state and network badge.
- Auth Modal Redesign:
  - Dual-mode tab switcher (Email OTP vs Web3 Wallet).
  - Micro-interactions for OTP countdown and wallet connect signature trigger.
  - Security and privacy assurances clearly displayed with elegant badges.

## Allowed Files
- `frontend/src/components/checkout/CheckoutModal.vue`
- `frontend/src/components/auth/AuthModal.vue`
- `frontend/test/checkout.test.ts`

## Dependencies
- `TASK-017` (Design System Elevation)

## Acceptance Criteria
- [x] Checkout modal renders HD address, high-contrast QR code with scan reticle, and live countdown timer.
- [x] Polling and manual verify triggers work seamlessly with status animations.
- [x] Auth modal presents sleek Web3 and OTP login tabs.
- [x] `pnpm --dir frontend test` passes without errors.
- [x] `pnpm --dir frontend build` compiles without errors.

## Verification Commands
```bash
pnpm --dir frontend test
pnpm --dir frontend build
```

## Status
DONE
