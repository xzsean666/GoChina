# TASK-013: Frontend Interactive Crypto Checkout Modal (QR Code, Countdown & Polling)

## Objective
Implement the interactive Web3 crypto checkout dialog with dynamic deposit address, high-definition scannable QR code, real-time expiration countdown, automated status polling, and an instant payment verification button.

## Scope
- Checkout Modal Component (`CheckoutModal.vue`):
  - Calls `POST /api/orders` to initiate checkout and retrieve Pay3 deposit address and expiration.
  - Generates crisp QR code using `qrcode` library for mobile crypto wallets.
  - 1-click copy button for receiving address and exact USDT amount.
  - Live animated countdown timer until `expires_at`.
  - Automated status polling (`GET /api/orders/:id`) every 3-5 seconds.
  - "I Have Paid" (`POST /api/orders/:id/verify`) manual trigger button with loading spinner.
  - Celebration transition when status switches to `paid`, redirecting to dashboard.
  - Warning alert if order expires or Pay3 detects `late_payment`.
- Unit tests validating countdown timer, copy clipboard, and polling lifecycle.

## Allowed Files
- `frontend/src/components/checkout/CheckoutModal.vue`
- `frontend/src/composables/useCountdown.ts`
- `frontend/src/composables/useOrderPolling.ts`
- `frontend/test/checkout.test.ts`

## Dependencies
- `TASK-010` (Workers API Gateway)
- `TASK-012` (Plan Discovery & Auth UI)

## Inputs and Outputs
- **Inputs**: Order creation API (`/api/orders`), Order status API (`/api/orders/:id`).
- **Outputs**: Polished, highly intuitive crypto checkout modal.

## Acceptance Criteria
- [x] Correctly renders deposit address and high-contrast scannable QR code.
- [x] Countdown updates smoothly every second and disables actions upon expiration.
- [x] Polling detects payment confirmation and transitions modal to success state.
- [x] Instant verify button triggers backend verification without page reload.

## Verification Commands
```bash
cd frontend && pnpm test
cd frontend && pnpm build
```

## Risks and Assumptions
- Clipboard copy API requires fallback for non-secure contexts.

## Status
DONE
