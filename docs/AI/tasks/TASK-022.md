# TASK-022 — Web3-Only Authentication & Removal of Email Registration

## 1. Context & Objective
The user explicitly requested:
> "我都没有配置，邮箱发送，你怎么都可以注册？这个先帮我移出喔。注册目前只支持web3 sign"

Because no production email delivery service (SES, Resend, Sendgrid, SMTP) has been configured or attached to the infrastructure, email OTP registration/login must be removed from the user-facing application. User registration and authentication across `GoChina` must strictly and exclusively rely on **Web3 wallet ECDSA signature verification (`personal_sign`)**.

---

## 2. Scope & Target Files

### Files to Modify:
1. `src/controllers/auth.controller.ts`
   - Explicitly disable `/api/auth/otp/request` and `/api/auth/otp/verify` endpoints, returning `400 Bad Request` with `{ error: 'Email registration is currently disabled. Please sign in with your Web3 wallet.' }`.
2. `frontend/src/components/auth/AuthModal.vue`
   - Remove Email OTP tab, email inputs, countdown timers, and email submission handlers.
   - Refactor modal into a dedicated, high-end Web3 Wallet Connection experience.
   - Display wallet provider badges (MetaMask, Rabby Wallet, Rainbow, WalletConnect), gasless signature explanation, and one-click `personal_sign` button.
3. `frontend/src/views/DashboardView.vue` & `frontend/src/views/HomeView.vue`
   - Remove references to email OTP in prompts and tooltips, standardizing on Web3 wallet connection.
4. `frontend/src/api/client.ts`
   - Deprecate `requestOtp` and `verifyOtp` methods.
5. `test/api.test.ts` & `test/e2e.test.ts`
   - Update integration tests to use `/api/auth/web3` as the primary user onboarding flow.
   - Assert that OTP request endpoints return disabled status.
6. `scripts/run-visual-e2e.ts`
   - Inject mock `window.ethereum` into Puppeteer page context.
   - Test Web3 wallet authentication end-to-end, updating screenshots in `docs/screenshots/`.
7. `docs/AI/TASK_INDEX.md` & `docs/AI/SESSION_STATE.md`
   - Document task state, verification results, and handover notes.

---

## 3. Acceptance Criteria
- [x] Email OTP registration and verification tab are completely removed from `AuthModal.vue`.
- [x] `AuthModal.vue` provides a streamlined, high-aesthetic Web3 signature login/registration UI.
- [x] Calling OTP endpoints on the backend returns HTTP 400 with a disabled warning.
- [x] Web3 wallet authentication works seamlessly via `/api/auth/web3`.
- [x] All unit and integration test suites pass (`pnpm test` and `pnpm --dir frontend test`).
- [x] Frontend builds cleanly with zero errors (`pnpm --dir frontend build`).
- [x] Visual E2E test runs cleanly (`pnpm test:visual`) and captures all updated modal screenshots.

---

## 4. Verification Summary
1. `pnpm test`: 11 test suites passed, 55 tests passed.
2. `pnpm --dir frontend test`: 5 test suites passed, 13 tests passed.
3. `pnpm --dir frontend build`: Vue 3 + TypeScript production build succeeded in 3.69s.
4. `pnpm test:visual`: Headless Chrome full-lifecycle visual test captured 14 screenshots in `docs/screenshots/`.
5. Status: **DONE**
