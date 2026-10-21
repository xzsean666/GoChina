# TASK-002: Project Scaffolding, TypeScript/Workers Build Config & Vitest Test Harness

## Objective
Set up the TypeScript and Cloudflare Workers project scaffolding, package dependencies (including `cloudflare-worker-kvdb` via Git+Hash, `jose` for JWT), `wrangler.jsonc`, and Vitest test harness for the edge runtime.

## Scope
- Initialize `package.json` with scripts (`build`, `test`, `dev`, `typecheck`).
- Configure `tsconfig.json` for Cloudflare Workers / NodeNext module resolution.
- Configure `wrangler.jsonc` (or `wrangler.toml`) declaring D1 database bindings, KV namespaces, and environment variables.
- Configure `vitest.config.ts` for unit and integration testing.
- Install necessary dependencies (`pnpm install`).

## Allowed Files
- `package.json`
- `pnpm-lock.yaml`
- `tsconfig.json`
- `wrangler.jsonc`
- `vitest.config.ts`
- `src/index.ts`
- `test/setup.ts`

## Dependencies
- `TASK-001` (Architecture Spec & AI Governance Docs)

## Inputs and Outputs
- **Inputs**: Architecture specification, internal SDK guide for `cloudflare-worker-kvdb`.
- **Outputs**: Fully functional and compilable TypeScript package with test runner.

## Acceptance Criteria
- [x] `package.json` contains dependencies including `cloudflare-worker-kvdb` and `jose`.
- [x] `pnpm typecheck` runs without error.
- [x] `pnpm test` executes Vitest and passes sanity tests.
- [x] `wrangler.jsonc` defines `DB` (D1) and `KV` (Workers KV) bindings.

## Verification Commands
```bash
pnpm install
pnpm typecheck
pnpm test
```

## Risks and Assumptions
- Cloudflare Workers environment requires strict web standards and no native Node C++ addons.

## Status
DONE
