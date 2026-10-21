# TASK-004: User Authentication & Session Service (Passwordless OTP / Web3 & Auth Middleware)

## Objective
Implement user registration, passwordless email OTP verification or Web3 wallet sign-in, session JWT issuance/validation, and authentication middleware for Cloudflare Workers, leveraging `cloudflare-worker-kvdb` `users` Multi-Key table for O(1) point lookups.

## Scope
- Implement `AuthService`:
  - `sendOtp(email: string)`: Generates and caches short-lived OTP code in Workers KV.
  - `verifyOtpAndLogin(email: string, otp: string)`:
    - Validates OTP.
    - O(1) user lookup via `usersTable.getBy("email", email)`.
    - If user does not exist, creates record via `usersTable.set(id, userData, { keys: { email, role: "user", status: "active" } })`.
    - Signs HS256 JWT session token with user ID and role.
  - `verifyWalletAndLogin(address: string, signature: string, message: string)`:
    - Verifies EVM cryptographic signature.
    - O(1) user lookup via `usersTable.getBy("walletAddress", address)`.
    - Signs user session JWT.
  - `verifySessionToken(token: string)`: Validates JWT signature, expiration, and user status.
- Implement Workers auth middleware:
  - Extracts Bearer token from `Authorization` header.
  - Attaches `currentUser` to request context.
  - Enforces RBAC roles (`user` / `admin`).
- Unit tests verifying OTP generation, session verification, and role checks.

## Allowed Files
- `src/services/auth.ts`
- `src/middleware/auth.middleware.ts`
- `src/types/auth.ts`
- `test/auth.service.test.ts`

## Dependencies
- `TASK-003` (Domain Models & KVDB)

## Inputs and Outputs
- **Inputs**: User credentials/OTP, Workers KV cache, JWT secrets, KVDB `users` table.
- **Outputs**: Validated user session token, auth middleware.

## Acceptance Criteria
- [x] Successfully issues and verifies signed JWT session tokens.
- [x] Uses `usersTable.getBy("email", email)` for O(1) user lookups.
- [x] Auth middleware correctly injects user context and blocks unauthenticated requests.
- [x] Admin-only endpoints reject normal users with 403 Forbidden.
- [x] Unit tests pass with 100% coverage on auth flows.

## Verification Commands
```bash
pnpm test test/auth.service.test.ts
pnpm typecheck
```

## Risks and Assumptions
- User session tokens must remain strictly separate from client entitlement tokens.

## Status
DONE

