# TASK-015: Frontend Admin Management Panel (Plan Management, Order Audit & Pay3 Diagnostics)

## Objective
Implement an administrative management panel within the frontend for authorized admins to manage service catalog plans, view and audit orders, and inspect Pay3 transaction diagnostics.

## Scope
- Admin View Components (`AdminView.vue`):
  - RBAC protection: only accessible when `user.role === "admin"`.
  - Plan Management Tab:
    - Table displaying all plans (Name, Category, Price USD, Quota, Duration, Enabled).
    - Modal dialog to add or edit plan parameters.
    - Toggle plan active/disabled switch.
  - Order Inspection & Pay3 Audit Tab:
    - List recent orders with Pay3 linkage, child deposit address, and payment status.
    - View Pay3 diagnostic flags (`problem_payment_count`, `late_payment_count`, on-time vs late amounts).
- Component tests mocking admin API calls.

## Allowed Files
- `frontend/src/views/AdminView.vue`
- `frontend/src/components/admin/PlanTable.vue`
- `frontend/src/components/admin/PlanModal.vue`
- `frontend/src/components/admin/OrderAuditTable.vue`
- `frontend/test/admin.test.ts`

## Dependencies
- `TASK-010` (Workers API Gateway)
- `TASK-011` (Frontend Scaffolding)

## Inputs and Outputs
- **Inputs**: Admin APIs (`/api/admin/plans`, `/api/admin/orders`).
- **Outputs**: Secure administrative control interface.

## Acceptance Criteria
- [x] Non-admin users are strictly blocked from accessing the view.
- [x] Plan modal correctly creates and updates service plan entries.
- [x] Order inspection accurately displays Pay3 payment status and diagnostic indicators.
- [x] Component tests pass.

## Verification Commands
```bash
cd frontend && pnpm test
cd frontend && pnpm build
```

## Risks and Assumptions
- Admin tokens must be verified server-side on every request to prevent unauthorized manipulation.

## Status
DONE
