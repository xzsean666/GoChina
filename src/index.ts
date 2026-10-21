import { createApp } from './router/router.js';
import { handleScheduledSweep } from './cron/sweeper.js';

export interface Env {
  DB: D1Database;
  CACHE_KV: KVNamespace;
  ENVIRONMENT: string;
  PAY3_BASE_URL: string;
  PAY3_JWT_SECRET: string;
  PORTAL_JWT_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const app = createApp(env, ctx);
    return await app.fetch(request, env, ctx);
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`Cron sweep triggered at: ${new Date(event.scheduledTime).toISOString()}`);
    try {
      const stats = await handleScheduledSweep(env, ctx);
      console.log(`Cron sweep completed: ${JSON.stringify(stats)}`);
    } catch (err) {
      console.error('Cron sweep error:', err);
    }
  },
};
