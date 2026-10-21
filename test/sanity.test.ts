import { describe, it, expect } from 'vitest';
import worker from '../src/index.js';
import { createMockEnv, createMockExecutionContext } from './setup.js';

describe('Sanity & Worker Scaffolding Test', () => {
  it('responds with 200 on /health', async () => {
    const env = createMockEnv();
    const ctx = createMockExecutionContext();
    const req = new Request('http://localhost/health');
    const res = await worker.fetch(req, env, ctx);

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.status).toBe('ok');
    expect(body.service).toBe('gochina-portal');
  });

  it('runs scheduled handler without errors', async () => {
    const env = createMockEnv();
    const ctx = createMockExecutionContext();
    const event = {
      cron: '*/5 * * * *',
      type: 'scheduled',
      scheduledTime: Date.now(),
      noRetry: () => {},
      waitUntil: (_p: Promise<any>) => {},
    } as unknown as ScheduledEvent;

    await expect(worker.scheduled(event, env, ctx)).resolves.toBeUndefined();
  });
});
