import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createDatabase } from '../db/client.js';
import { Pay3Client } from '../pay3/client.js';
import { AuthService } from '../services/auth.js';
import { PlanService } from '../services/plan.js';
import { OrderService } from '../services/order.js';
import { VerificationService } from '../services/verification.js';
import { EntitlementService } from '../services/entitlement.js';
import { TalentService } from '../services/talent.js';
import { InquiryService } from '../services/inquiry.js';
import { ContractService } from '../services/contract.js';
import { createAuthController } from '../controllers/auth.controller.js';
import { createPlanController } from '../controllers/plan.controller.js';
import { createOrderController } from '../controllers/order.controller.js';
import { createEntitlementController } from '../controllers/entitlement.controller.js';
import { createAdminController } from '../controllers/admin.controller.js';
import { createTalentController } from '../controllers/talent.controller.js';
import { createInquiryController } from '../controllers/inquiry.controller.js';
import { createContractController } from '../controllers/contract.controller.js';
import { createFaucetController } from '../controllers/faucet.controller.js';
import { seedDatabase } from '../db/seed.js';
import type { AuthEnv } from '../middleware/auth.middleware.js';
import type { Env } from '../index.js';

export function createApp(env: Env, ctx?: ExecutionContext) {
  const app = new Hono<AuthEnv>();

  // Global CORS Middleware
  app.use(
    '*',
    cors({
      origin: (origin) => {
        if (env.ENVIRONMENT === 'test' || env.ENVIRONMENT === 'development' || !origin) {
          return '*';
        }
        if (
          origin === 'https://gochina.io' ||
          origin.endsWith('.gochina.io') ||
          origin.endsWith('.pages.dev')
        ) {
          return origin;
        }
        return null;
      },
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
      exposeHeaders: ['Content-Length'],
      maxAge: 86400,
    })
  );

  // Storage & Service Layer Initializations
  const db = createDatabase(env, ctx);
  const pay3Client = new Pay3Client({
    baseUrl: env.PAY3_BASE_URL,
    jwtSecret: env.PAY3_JWT_SECRET,
  });

  const authService = new AuthService(db, env.CACHE_KV, {
    jwtSecret: env.PORTAL_JWT_SECRET,
    environment: env.ENVIRONMENT,
  });

  const planService = new PlanService(db, env.CACHE_KV, ctx);
  const orderService = new OrderService(db, pay3Client);
  const entitlementService = new EntitlementService(db);
  const verificationService = new VerificationService(db, pay3Client, entitlementService);
  const talentService = new TalentService(db);
  const inquiryService = new InquiryService(db);
  const contractService = new ContractService(db, pay3Client);

  // Health check endpoints
  app.get('/health', (c) =>
    c.json({
      status: 'ok',
      service: 'gochina-portal',
      environment: env.ENVIRONMENT,
      timestamp: new Date().toISOString(),
    })
  );

  app.get('/healthz', (c) =>
    c.json({
      status: 'ok',
      storage: 'ready',
      timestamp: new Date().toISOString(),
    })
  );

  app.post('/api/setup/seed', async (c) => {
    try {
      await db.init();
      await seedDatabase(db);
      return c.json({ status: 'ok', message: 'Database schema initialized & seed data populated' });
    } catch (err: any) {
      return c.json({ error: err?.message || String(err) }, 500);
    }
  });

  // Mount API Controllers
  app.route('/api/auth', createAuthController(authService, entitlementService));
  app.route('/api/user', createAuthController(authService, entitlementService));
  app.route('/api/plans', createPlanController(planService));
  app.route('/api/orders', createOrderController(authService, orderService, verificationService));
  app.route('/api/entitlements', createEntitlementController(authService, entitlementService));
  app.route('/api/talents', createTalentController(talentService, authService));
  app.route('/api/inquiries', createInquiryController(inquiryService, authService));
  app.route('/api/contracts', createContractController(contractService, verificationService, authService));
  app.route('/api/faucet', createFaucetController(env));
  app.route('/api/admin', createAdminController(authService, planService, db));

  // Global Error Handling
  app.onError((err, c) => {
    console.error('Unhandled Application Error:', err);
    const message =
      env.ENVIRONMENT === 'production'
        ? 'Internal Server Error'
        : err.message || 'Internal Server Error';
    return c.json({ error: message }, 500);
  });

  app.notFound((c) => {
    return c.json({ error: 'Endpoint Not Found' }, 404);
  });

  return app;
}
