import { Hono } from 'hono';
import type { PlanService } from '../services/plan.js';
import type { AuthEnv } from '../middleware/auth.middleware.js';

export function createPlanController(planService: PlanService) {
  const router = new Hono<AuthEnv>();

  // GET /api/plans
  router.get('/', async (c) => {
    const category = c.req.query('category') || undefined;
    const plans = await planService.listActivePlans(category);
    return c.json({ plans }, 200);
  });

  // GET /api/plans/:id
  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const plan = await planService.getPlanById(id);
    if (!plan || plan.enabled !== 1) {
      return c.json({ error: `Plan '${id}' not found` }, 404);
    }
    return c.json({ plan }, 200);
  });

  return router;
}
