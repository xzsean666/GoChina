import { Hono } from 'hono';
import type { AuthService } from '../services/auth.js';
import type { OrderService } from '../services/order.js';
import type { VerificationService } from '../services/verification.js';
import { createAuthMiddleware, type AuthEnv } from '../middleware/auth.middleware.js';

export function createOrderController(
  authService: AuthService,
  orderService: OrderService,
  verificationService: VerificationService
) {
  const router = new Hono<AuthEnv>();

  // Apply auth middleware to all order operations
  router.use('*', createAuthMiddleware(authService));

  // POST /api/orders: Create checkout order
  router.post('/', async (c) => {
    const user = c.get('user');
    const body = await c.req.json<{ planId: string }>().catch(() => ({ planId: '' }));

    if (!body.planId) {
      return c.json({ error: 'planId is required' }, 400);
    }

    try {
      const checkout = await orderService.createCheckoutOrder(user.id, body.planId);
      return c.json(checkout, 201);
    } catch (err: any) {
      return c.json({ error: err.message }, 400);
    }
  });

  // GET /api/orders/:id: Get order details
  router.get('/:id', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');

    try {
      const order = await orderService.getOrderDetails(id, user.id);
      if (!order) {
        return c.json({ error: `Order '${id}' not found` }, 404);
      }
      return c.json({ order }, 200);
    } catch (err: any) {
      return c.json({ error: err.message }, 403);
    }
  });

  // POST /api/orders/:id/verify: Instant payment scan & fulfillment
  router.post('/:id/verify', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');

    try {
      const result = await verificationService.verifyOrderInstant(id, user.id);
      return c.json(result, 200);
    } catch (err: any) {
      return c.json({ error: err.message }, 400);
    }
  });

  // GET /api/user/orders: List user orders with cursor pagination
  router.get('/user/list', async (c) => {
    const user = c.get('user');
    const cursor = c.req.query('cursor') || undefined;
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!, 10) : 10;

    const page = await orderService.getUserOrders(user.id, cursor, limit);
    return c.json(page, 200);
  });

  return router;
}
