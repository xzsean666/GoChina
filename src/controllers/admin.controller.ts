import { Hono } from 'hono';
import type { DatabaseClient } from '../db/client.js';
import type { AuthService } from '../services/auth.js';
import type { PlanService } from '../services/plan.js';
import type { CreatePlanInput, UpdatePlanInput } from '../types/plan.js';
import { createAuthMiddleware, type AuthEnv } from '../middleware/auth.middleware.js';

export function createAdminController(
  authService: AuthService,
  planService: PlanService,
  db: DatabaseClient
) {
  const router = new Hono<AuthEnv>();

  // Enforce admin RBAC across all /api/admin/* endpoints
  router.use('*', createAuthMiddleware(authService, { requiredRole: 'admin' }));

  // GET /api/admin/plans: List all plans including drafts/disabled
  router.get('/plans', async (c) => {
    const plans = await planService.listAllPlansAdmin();
    return c.json({ plans }, 200);
  });

  // POST /api/admin/plans: Create new plan
  router.post('/plans', async (c) => {
    const body = await c.req.json<CreatePlanInput>().catch(() => ({} as CreatePlanInput));
    try {
      const plan = await planService.createPlan(body);
      return c.json({ plan }, 201);
    } catch (err: any) {
      return c.json({ error: err.message }, 400);
    }
  });

  // PUT /api/admin/plans/:id: Update existing plan
  router.put('/plans/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json<UpdatePlanInput>().catch(() => ({} as UpdatePlanInput));
    try {
      const plan = await planService.updatePlan(id, body);
      return c.json({ plan }, 200);
    } catch (err: any) {
      return c.json({ error: err.message }, 400);
    }
  });

  // GET /api/admin/orders: Audit orders and Pay3 diagnostics
  router.get('/orders', async (c) => {
    const cursor = c.req.query('cursor') || undefined;
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!, 10) : 20;
    const status = c.req.query('status') || undefined;

    const query = status ? { status } : {};
    const page = await db.orders.findPage(query, {
      cursor,
      limit,
      sort: [{ field: 'created_at', direction: 'desc' }],
    });

    const orders = page.items.map((item: any) => ({
      id: item.key || item.id,
      ...item,
    }));

    return c.json({
      orders,
      cursor: page.cursor,
      hasMore: !page.complete,
    }, 200);
  });

  return router;
}
