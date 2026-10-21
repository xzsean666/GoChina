import { Hono, type Context } from 'hono';
import type { AuthService } from '../services/auth.js';
import type { EntitlementService } from '../services/entitlement.js';
import { createAuthMiddleware, type AuthEnv } from '../middleware/auth.middleware.js';

export function createAuthController(
  authService: AuthService,
  entitlementService: EntitlementService
) {
  const router = new Hono<AuthEnv>();

  // POST /api/auth/otp & /api/auth/otp/request
  // Disabled: Email registration is removed since no email sending service is configured.
  const handleOtpRequest = async (c: Context<AuthEnv>) => {
    return c.json({
      error: 'Email registration and OTP verification are currently disabled. Please authenticate with your Web3 wallet.',
    }, 400);
  };
  router.post('/otp', handleOtpRequest);
  router.post('/otp/request', handleOtpRequest);

  // POST /api/auth/login & /api/auth/otp/verify
  // Disabled: Email registration is removed since no email sending service is configured.
  const handleOtpLogin = async (c: Context<AuthEnv>) => {
    return c.json({
      error: 'Email registration and OTP verification are currently disabled. Please authenticate with your Web3 wallet.',
    }, 400);
  };
  router.post('/login', handleOtpLogin);
  router.post('/otp/verify', handleOtpLogin);

  // POST /api/auth/wallet & /api/auth/web3
  const handleWalletLogin = async (c: Context<AuthEnv>) => {
    const body = await c.req
      .json<{ address: string; signature?: string; message?: string }>()
      .catch(() => ({ address: '', signature: undefined, message: undefined }));
    if (!body.address || !body.signature || !body.message) {
      return c.json({ error: 'Ethereum address, signature, and message are required' }, 400);
    }

    try {
      const res = await authService.verifyWalletAndLogin(body.address, body.signature, body.message);
      return c.json(res, 200);
    } catch (err: any) {
      return c.json({ error: err.message }, 401);
    }
  };
  router.post('/wallet', handleWalletLogin);
  router.post('/web3', handleWalletLogin);

  // GET /api/user/entitlements
  router.get('/entitlements', createAuthMiddleware(authService), async (c) => {
    const user = c.get('user');
    const entitlements = await entitlementService.getUserEntitlements(user.id);
    return c.json({ entitlements }, 200);
  });

  // GET /api/user/profile
  router.get('/profile', createAuthMiddleware(authService), async (c) => {
    const user = c.get('user');
    const entitlements = await entitlementService.getUserEntitlements(user.id);
    const activeCount = entitlements.filter((e) => e.status === 'active').length;

    return c.json({
      user,
      stats: {
        totalEntitlements: entitlements.length,
        activeEntitlements: activeCount,
      },
    });
  });

  return router;
}
