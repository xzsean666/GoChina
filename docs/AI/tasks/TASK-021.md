# TASK-021: Full-Flow Visual E2E Test Suite & Comprehensive Screenshot Capture

## Objective
Implement an automated, full-lifecycle visual E2E test runner using headless Google Chrome (`puppeteer-core`) that covers all pages, states, and features of the GoChina portal (Landing Hero, Theme/Language switches, Plan Pricing Matrix, Web3 & OTP Auth, Crypto Cashier Checkout with QR/Countdown, Payment Settlement Celebration, User Dashboard with Quota Gauges & Credentials, and Admin Operations Console with Plan Management and Order Audit). Generate high-resolution visual proof screenshots into `docs/screenshots/` and produce a comprehensive visual test report `docs/VISUAL_E2E_REPORT.md`.

## Scope
- Create an automated visual test runner `scripts/run-visual-e2e.ts` (or `test/visual-e2e.ts`):
  - In-process HTTP server binding the Hono Worker backend with in-memory D1 and KVDB schemas.
  - Mock Pay3 daemon simulating HD address derivation and instant payment confirmation.
  - Vite frontend server serving the elevated UI.
  - Headless Chrome browser runner capturing high-resolution snapshots across the complete user and admin journey.
- Capture comprehensive screenshot gallery in `docs/screenshots/`:
  1. `01-landing-hero-dark.png` — Landing hero in Obsidian Dark theme with Anycast telemetry pill.
  2. `02-pricing-plans-toggle.png` — Pricing section with billing toggle and Pro card highlight.
  3. `03-architecture-features.png` — Edge infrastructure architecture feature grid.
  4. `04-theme-toggle-light.png` — Alpine Crisp light theme view.
  5. `05-language-switch.png` — Multilingual dropdown switcher.
  6. `06-auth-modal-email-otp.png` — Email OTP authentication modal with countdown.
  7. `07-auth-modal-web3.png` — Web3 Wallet login modal.
  8. `08-checkout-modal-active.png` — Web3 Cashier modal with QR code, reticles, and countdown.
  9. `09-checkout-paid-success.png` — Payment success celebration state.
  10. `10-user-dashboard-overview.png` — User dashboard with metrics and entitlement cards.
  11. `11-credential-token-modal.png` — Access credentials token inspection dialog.
  12. `12-admin-plan-management.png` — Admin console plan management catalog.
  13. `13-admin-create-plan-modal.png` — Admin create/edit plan dialog.
  14. `14-admin-order-audit-pay3.png` — Admin order audit and Pay3 diagnostic table.
- Document the visual walkthrough in `docs/VISUAL_E2E_REPORT.md`.

## Allowed Files
- `package.json`
- `scripts/run-visual-e2e.ts`
- `docs/screenshots/*`
- `docs/VISUAL_E2E_REPORT.md`
- `docs/AI/TASK_INDEX.md`
- `docs/AI/SESSION_STATE.md`

## Dependencies
- `TASK-016` (E2E Integration & Runbook)
- `TASK-017` ~ `TASK-020` (Phase 2 UI Elevation)

## Acceptance Criteria
- [x] Visual E2E test runner script executes without runtime errors.
- [x] All 14 screenshots are captured with high resolution and saved into `docs/screenshots/`.
- [x] Complete user journey verified visually: Landing -> Pricing -> Auth -> Crypto Checkout -> Settlement -> Dashboard -> Admin Audit.
- [x] `docs/VISUAL_E2E_REPORT.md` details each screenshot and feature verification.

## Verification Commands
```bash
pnpm test:visual
ls -lh docs/screenshots/
```

## Status
DONE
