# AGENTS.md — GoChina Portal Engineering Guidelines

This file serves as the fundamental rules, architecture principles, and operating standards for AI engineering agents working in the `GoChina` repository.

---

## 1. Project Context & Positioning

`GoChina` is a next-generation Serverless Web Portal & Service Platform (GoChina 数字化服务与订阅门户系统) engineered natively for the **Cloudflare Serverless Ecosystem** (Cloudflare Workers, Pages, D1, Workers KV, and R2).

The portal delivers an end-to-end self-service journey:
- **Web UI & User Dashboard**: Modern, multi-language frontend for discovering services/plans, user registration/login, crypto checkout, active service tracking, and entitlement delivery.
- **Edge Backend API**: Ultra-low latency Cloudflare Workers handling authentication, product/service catalog, order lifecycle, payment verification, and digital service fulfillment.
- **Storage & State Layer**: Powered by [`cloudflare-worker-kvdb`](file:///ssd0/git/cloudlflare-worker-kvdb) over Cloudflare D1 (SQLite) with auto-batching, secondary B-Tree indexing, multi-tier caching (L1 memory + L2 KV), and R2 overflow.
- **Crypto Payment Gateway**: Deep integration with [`pay3`](file:///ssd0/git/pay3), an enterprise ERC20 payment daemon providing HD unique child address derivation, non-custodial checkout, automated chain transfer scanning, and treasury sweep.
- **Service Fulfillment & Delivery**: Automated digital service entitlement provisioning, quota tracking, and license/token delivery upon verified on-chain payment.

---

## 2. Fact Sources & AI Governance

All engineering development in this repository must strictly adhere to the following fact sources:
- **Developer Instructions**: [`docs/AI_AGENT_PROMPT.md`](file:///ssd0/git/GoChina/docs/AI_AGENT_PROMPT.md)
- **Project Goals & Scope**: [`docs/AI/GOAL.md`](file:///ssd0/git/GoChina/docs/AI/GOAL.md)
- **Task Index & Roadmap**: [`docs/AI/TASK_INDEX.md`](file:///ssd0/git/GoChina/docs/AI/TASK_INDEX.md)
- **Current Session State**: [`docs/AI/SESSION_STATE.md`](file:///ssd0/git/GoChina/docs/AI/SESSION_STATE.md)
- **Current Tasks**: [`docs/AI/tasks/TASK-xxx.md`](file:///ssd0/git/GoChina/docs/AI/tasks/)
- **System Architecture**: [`docs/AI/ARCHITECTURE.md`](file:///ssd0/git/GoChina/docs/AI/ARCHITECTURE.md)
- **Portal Specification**: [`docs/ARCHITECTURE.PROTAL.md`](file:///ssd0/git/GoChina/docs/ARCHITECTURE.PROTAL.md)
- **Architectural Decisions**: [`docs/AI/DECISIONS.md`](file:///ssd0/git/GoChina/docs/AI/DECISIONS.md)
- **Internal SDK Guide**: [`docs/INTERNAL_SDK_GUIDE.md`](file:///ssd0/git/GoChina/docs/INTERNAL_SDK_GUIDE.md)

---

## 3. Strict Operating Principles

1. **One Task per Session**: Focus strictly on the assigned active task. Do not implement features out of scope.
2. **Never Guess or Extrapolate Outside Facts**: No assumptions about external domains or tools without explicit requirements.
3. **Never Break Working Directory Boundaries**: Repository root is `/ssd0/git/GoChina`.
4. **GitHub Account Routing**:
   - For `/ssd0/git/*`, GitHub user is strictly **`xzsean666`**.
   - Always run `gh auth switch --user xzsean666` before invoking any GitHub CLI (`gh`) or Git push operations.
5. **Cloudflare Runtime Compatibility**:
   - Code must run in the Cloudflare Workers / `workerd` environment.
   - Do NOT import Node.js native C++ binary addons. Use `@cloudflare/workers-types` and standard Web APIs (`fetch`, `crypto`, `Streams`, `TextEncoder`).
6. **Internal SDK Standards**:
   - Store dependencies via Git + Commit Hash (or path link for rapid local dev).
   - Consult target SDK's `docs/AI/SKILL.md` before coding.
7. **No Blind Claims**:
   - Never claim a test has passed without actually running the verification command.
   - Record exact commands and terminal outputs in session handover notes.
