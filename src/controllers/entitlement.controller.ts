import { Hono } from 'hono';
import type { AuthService } from '../services/auth.js';
import type { EntitlementService } from '../services/entitlement.js';
import { createAuthMiddleware, type AuthEnv } from '../middleware/auth.middleware.js';

export function createEntitlementController(
  authService: AuthService,
  entitlementService: EntitlementService
) {
  const router = new Hono<AuthEnv>();

  // GET /api/user/entitlements: User's active service entitlements (protected)
  router.get('/user/list', createAuthMiddleware(authService), async (c) => {
    const user = c.get('user');
    const entitlements = await entitlementService.getUserEntitlements(user.id);
    return c.json({ entitlements }, 200);
  });

  // POST /api/entitlements/verify: Public/Service validation of an API token
  router.post('/verify', async (c) => {
    const body = await c.req.json<{ token: string }>().catch(() => ({ token: '' }));
    if (!body.token) {
      return c.json({ valid: false, error: 'Token is required' }, 400);
    }

    const result = await entitlementService.verifyEntitlementToken(body.token);
    return c.json(result, result.valid ? 200 : 403);
  });

  // POST /api/entitlements/consume: Decrement API quota usage
  router.post('/consume', async (c) => {
    const body = await c.req
      .json<{ token: string; calls?: number; bandwidthBytes?: number }>()
      .catch(() => ({ token: '', calls: undefined, bandwidthBytes: undefined }));

    if (!body.token) {
      return c.json({ error: 'Token is required' }, 400);
    }

    const calls = body.calls !== undefined ? body.calls : 1;
    const bandwidthBytes = body.bandwidthBytes !== undefined ? body.bandwidthBytes : 0;

    if (typeof calls !== 'number' || calls < 0 || !Number.isInteger(calls)) {
      return c.json({ error: 'calls must be a non-negative integer' }, 400);
    }
    if (typeof bandwidthBytes !== 'number' || bandwidthBytes < 0 || !Number.isFinite(bandwidthBytes)) {
      return c.json({ error: 'bandwidthBytes must be a non-negative number' }, 400);
    }

    try {
      const result = await entitlementService.recordUsage(
        body.token,
        calls,
        bandwidthBytes
      );
      return c.json(result, 200);
    } catch (err: any) {
      return c.json({ error: err.message }, 403);
    }
  });

  return router;
}
