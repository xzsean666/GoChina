# TASK-016: End-to-End Integration Test Suite, Wrangler Deployment & Release Runbook

## Objective
Verify the entire end-to-end user journey (browse plan -> create order -> simulate Pay3 payment -> instant verify / cron sweep -> activate entitlement in KVDB -> query user active entitlements), configure Cloudflare Wrangler production deployment scripts, and produce the deployment runbook.

## Scope
- End-to-End integration test suite (`test/e2e.test.ts`):
  1. User registers/logs in and fetches available plans from KVDB cache.
  2. User initiates checkout; Worker generates order and binds Pay3 child deposit address.
  3. Simulate EVM payment confirmation in Pay3 mock.
  4. Trigger verify / cron sweeper; verify order turns `paid` and user entitlement is auto-activated in KVDB.
  5. Fetch `/api/user/entitlements` and assert valid entitlement state, validity period, and quota.
- Cloudflare deployment automation:
  - Workers deploy script (`scripts/deploy-worker.sh`).
  - Pages deploy script (`scripts/deploy-pages.sh`).
  - KVDB seed verification script (`scripts/seed.ts`).
- Documentation:
  - Finalize `README.md` with deployment runbook, environment variable checklist, and operational procedures.

## Allowed Files
- `test/e2e.test.ts`
- `scripts/deploy-worker.sh`
- `scripts/deploy-pages.sh`
- `scripts/seed.ts`
- `README.md`
- `docs/AI/SESSION_STATE.md`

## Dependencies
- `TASK-014` (User Dashboard)
- `TASK-015` (Admin Panel)

## Inputs and Outputs
- **Inputs**: Complete frontend and edge backend implementation.
- **Outputs**: Passing E2E test suite, deployment automation scripts, and complete README runbook.

## Acceptance Criteria
- [x] Complete E2E integration test runs and passes in Vitest Miniflare environment.
- [x] Deployment scripts verify Wrangler login and deploy Workers and Pages cleanly.
- [x] `README.md` provides unambiguous setup, KVDB configuration, Pay3 environment variables, and operations guidance.

## Verification Commands
```bash
pnpm test
pnpm typecheck
cd frontend && pnpm build
bash scripts/deploy-worker.sh --dry-run
```

## Risks and Assumptions
- Requires valid Cloudflare API token or Wrangler authenticated CLI for real production deployment.

## Status
DONE
