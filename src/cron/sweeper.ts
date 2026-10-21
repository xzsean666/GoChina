import { createDatabase } from '../db/client.js';
import { Pay3Client } from '../pay3/client.js';
import { EntitlementService } from '../services/entitlement.js';
import { VerificationService, type SweepResult } from '../services/verification.js';
import type { Env } from '../index.js';

export async function handleScheduledSweep(
  env: Env,
  ctx?: ExecutionContext,
  batchSize = 20
): Promise<SweepResult> {
  const db = createDatabase(env, ctx);
  await db.init();

  const pay3Client = new Pay3Client({
    baseUrl: env.PAY3_BASE_URL,
    jwtSecret: env.PAY3_JWT_SECRET,
  });

  const entitlementService = new EntitlementService(db);
  const verificationService = new VerificationService(db, pay3Client, entitlementService);
  return await verificationService.sweepPendingOrders(batchSize);
}
