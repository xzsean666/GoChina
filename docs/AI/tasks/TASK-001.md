# TASK-001: Architecture Specification, Internal SDK Skill Generation & AI Documentation Governance Framework

## Objective
Establish the foundational AI engineering governance documentation, the comprehensive GoChina Portal architecture specification (`docs/ARCHITECTURE.PROTAL.md`), generate the standard AI skill documentation for the dependent `pay3` SDK (`/ssd0/git/pay3/docs/AI/SKILL.md`) in accordance with `docs/INTERNAL_SDK_GUIDE.md`, and create the initial fine-grained engineering task index.

## Scope
- Author `AGENTS.md` and `docs/AI_AGENT_PROMPT.md` defining strict operating, no-guessing, and GitHub routing principles.
- Update `docs/INTERNAL_SDK_GUIDE.md` to register `cloudlflare-worker-kvdb` and `pay3`.
- Analyze `/ssd0/git/pay3` source code and produce `/ssd0/git/pay3/docs/AI/SKILL.md`.
- Populate `docs/ARCHITECTURE.PROTAL.md` and `docs/AI/ARCHITECTURE.md` with complete edge architecture, KVDB data models, sequence diagrams, and Pay3 integration flows.
- Define `docs/AI/GOAL.md`, `docs/AI/DECISIONS.md`, and `docs/AI/TASK_INDEX.md`.
- Create task specifications `TASK-001.md` through `TASK-016.md`.
- Initialize `docs/AI/SESSION_STATE.md`.

## Allowed Files
- `AGENTS.md`
- `docs/AI_AGENT_PROMPT.md`
- `docs/INTERNAL_SDK_GUIDE.md`
- `docs/ARCHITECTURE.PROTAL.md`
- `docs/AI/ARCHITECTURE.md`
- `docs/AI/GOAL.md`
- `docs/AI/DECISIONS.md`
- `docs/AI/TASK_INDEX.md`
- `docs/AI/SESSION_STATE.md`
- `docs/AI/tasks/TASK-*.md`
- `/ssd0/git/pay3/docs/AI/SKILL.md`

## Dependencies
None. This is the root initialization task.

## Inputs and Outputs
- **Inputs**: User prompt requirements, `docs/INTERNAL_SDK_GUIDE.md`, `/ssd0/git/cloudlflare-worker-kvdb` skill, `/ssd0/git/pay3` source code & architecture.
- **Outputs**: Complete suite of AI governance documents, portal architecture specification, Pay3 skill guide, and 16 task specification files.

## Acceptance Criteria
- [x] `AGENTS.md` specifies GitHub routing (`xzsean666`), Cloudflare runtime rules, no-guessing principles, and single-task principles.
- [x] `docs/AI_AGENT_PROMPT.md` accurately records the developer instructions.
- [x] `docs/INTERNAL_SDK_GUIDE.md` registers `cloudlflare-worker-kvdb` and `pay3`.
- [x] `/ssd0/git/pay3/docs/AI/SKILL.md` matches the template defined in Section 5.3 of `INTERNAL_SDK_GUIDE.md`.
- [x] `docs/ARCHITECTURE.PROTAL.md` details edge topology, KVDB schema tables, Pay3 payment flow, entitlement fulfillment, and API endpoints.
- [x] `docs/AI/GOAL.md` and `docs/AI/DECISIONS.md` (ADR-001 to ADR-006) are created.
- [x] `docs/AI/TASK_INDEX.md` and tasks `TASK-001` through `TASK-016` are cataloged.
- [x] `docs/AI/SESSION_STATE.md` is initialized and maintained.

## Verification Commands
```bash
ls -la AGENTS.md docs/ docs/AI docs/AI/tasks
cat /ssd0/git/pay3/docs/AI/SKILL.md | head -n 30
git status --short
```

## Risks and Assumptions
- **Assumptions**: The system targets Cloudflare Workers and Cloudflare Pages serverless runtime using TypeScript.

## Status
DONE
