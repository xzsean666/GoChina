import { Hono } from 'hono';
import type { ContractService } from '../services/contract.js';
import type { VerificationService } from '../services/verification.js';
import type { AuthService } from '../services/auth.js';
import { createAuthMiddleware, type AuthEnv } from '../middleware/auth.middleware.js';

export function createContractController(
  contractService: ContractService,
  verificationService: VerificationService,
  authService: AuthService
) {
  const router = new Hono<AuthEnv>();

  // Base auth check for all contract operations
  router.use('*', createAuthMiddleware(authService));

  // List contracts (User gets their contracts, Admin gets all)
  router.get('/', async (c) => {
    try {
      const user = c.get('user');
      const isAdmin = user.role === 'admin';
      const status = c.req.query('status');

      const contracts = await contractService.listContracts(
        isAdmin ? undefined : user.id,
        status,
        isAdmin
      );

      return c.json({ contracts });
    } catch (err: any) {
      return c.json({ error: err.message || 'Failed to list contracts' }, 500);
    }
  });

  // Get single contract details
  router.get('/:id', async (c) => {
    try {
      const user = c.get('user');
      const id = c.req.param('id');
      const isAdmin = user.role === 'admin';

      const contract = await contractService.getContractById(id, user.id, isAdmin);
      if (!contract) {
        return c.json({ error: 'Contract not found' }, 404);
      }

      return c.json({ contract });
    } catch (err: any) {
      return c.json({ error: err.message || 'Failed to get contract' }, 500);
    }
  });

  // Admin / Agent: Create/Offer a contract to a user
  router.post('/', async (c) => {
    try {
      const user = c.get('user');
      if (user.role !== 'admin') {
        return c.json({ error: 'Forbidden: Admin access required' }, 403);
      }

      const body = await c.req.json();

      if (!body.userId || !body.talentId || !body.amount || !body.title) {
        return c.json(
          { error: 'userId, talentId, title, and amount are required' },
          400
        );
      }

      const contract = await contractService.createContract({
        userId: body.userId,
        userEmail: body.userEmail || '',
        category: body.category,
        talentId: body.talentId,
        talentName: body.talentName || 'Specialist',
        inquiryId: body.inquiryId,
        title: body.title,
        description: body.description || '',
        scopeOfWork: body.scopeOfWork || [],
        terms: body.terms,
        milestones: body.milestones || [],
        startDate: body.startDate || new Date().toISOString().slice(0, 10),
        endDate: body.endDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        amount: body.amount.toString(),
        currency: body.currency || 'USDT',
      });

      return c.json({ contract }, 201);
    } catch (err: any) {
      return c.json({ error: err.message || 'Failed to create contract' }, 400);
    }
  });

  // User: Checkout contract (derive HD crypto payment address via Pay3)
  router.post('/:id/checkout', async (c) => {
    try {
      const user = c.get('user');
      const contractId = c.req.param('id');

      const checkout = await contractService.createContractCheckout(contractId, user.id);
      return c.json(checkout);
    } catch (err: any) {
      return c.json({ error: err.message || 'Failed to initiate contract checkout' }, 400);
    }
  });

  // User / Admin: Instant verify payment status for a contract
  router.post('/:id/verify', async (c) => {
    try {
      const user = c.get('user');
      const contractId = c.req.param('id');
      const isAdmin = user.role === 'admin';

      const contract = await contractService.getContractById(contractId, user.id, isAdmin);
      if (!contract) {
        return c.json({ error: 'Contract not found' }, 404);
      }

      if (contract.paymentStatus === 'paid') {
        return c.json({ contract, paid: true, message: 'Contract already active and paid' });
      }

      if (!contract.orderId) {
        return c.json({ error: 'No checkout order found for this contract' }, 400);
      }

      const verifyResult = await verificationService.verifyOrderInstant(contract.orderId, user.id);
      const updatedContract = await contractService.getContractById(contractId, user.id, isAdmin);

      return c.json({
        paid: verifyResult.paid,
        contract: updatedContract,
        order: verifyResult.order,
      });
    } catch (err: any) {
      return c.json({ error: err.message || 'Verification failed' }, 500);
    }
  });

  // Update milestone status (Admin or user mark milestone completed)
  router.post('/:id/milestones/:index', async (c) => {
    try {
      const user = c.get('user');
      const contractId = c.req.param('id');
      const milestoneIndex = parseInt(c.req.param('index'), 10);
      const isAdmin = user.role === 'admin';
      const body = await c.req.json();

      const status = body.status as 'pending' | 'in_progress' | 'completed';
      if (!status) {
        return c.json({ error: 'Status is required' }, 400);
      }

      const updated = await contractService.updateMilestone(
        contractId,
        milestoneIndex,
        status,
        user.id,
        isAdmin
      );

      return c.json({ contract: updated });
    } catch (err: any) {
      return c.json({ error: err.message || 'Failed to update milestone' }, 400);
    }
  });

  // User: Final acceptance and complete contract
  router.post('/:id/complete', async (c) => {
    try {
      const user = c.get('user');
      const contractId = c.req.param('id');

      const completed = await contractService.completeContract(contractId, user.id);
      return c.json({ contract: completed });
    } catch (err: any) {
      return c.json({ error: err.message || 'Failed to complete contract' }, 400);
    }
  });

  return router;
}
