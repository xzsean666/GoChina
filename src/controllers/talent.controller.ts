import { Hono } from 'hono';
import type { TalentService } from '../services/talent.js';
import { createAuthMiddleware, type AuthEnv } from '../middleware/auth.middleware.js';
import type { AuthService } from '../services/auth.js';

export function createTalentController(talentService: TalentService, authService: AuthService) {
  const router = new Hono<AuthEnv>();

  // Public: List talents (supports category, query, limit)
  router.get('/', async (c) => {
    try {
      const category = c.req.query('category');
      const query = c.req.query('q');
      const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!, 10) : 50;

      const talents = await talentService.listTalents({ category, query, limit });
      return c.json({ talents });
    } catch (err: any) {
      return c.json({ error: err.message || 'Failed to list talents' }, 500);
    }
  });

  // Public: Get single talent details
  router.get('/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const talent = await talentService.getTalentById(id);
      if (!talent) {
        return c.json({ error: 'Talent not found' }, 404);
      }
      return c.json({ talent });
    } catch (err: any) {
      return c.json({ error: err.message || 'Failed to get talent' }, 500);
    }
  });

  // Admin only: Create talent
  router.post('/', createAuthMiddleware(authService, { requiredRole: 'admin' }), async (c) => {
    try {
      const body = await c.req.json();
      if (!body.name || !body.category) {
        return c.json({ error: 'Name and category are required' }, 400);
      }

      const talent = await talentService.createTalent({
        name: body.name,
        title: body.title || 'Professional Specialist',
        category: body.category,
        location: body.location || 'China',
        hourlyRate: body.hourlyRate || '30 USDT/hr',
        dailyRate: body.dailyRate,
        rating: body.rating || 5.0,
        completedContracts: body.completedContracts || 0,
        avatar: body.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        bio: body.bio || '',
        skills: body.skills || [],
        languages: body.languages || ['English', 'Chinese'],
        verified: body.verified !== undefined ? body.verified : true,
        status: body.status || 'active',
        sortOrder: body.sortOrder || 0,
      });

      return c.json({ talent }, 201);
    } catch (err: any) {
      return c.json({ error: err.message || 'Failed to create talent' }, 400);
    }
  });

  // Admin only: Update talent
  router.put('/:id', createAuthMiddleware(authService, { requiredRole: 'admin' }), async (c) => {
    try {
      const id = c.req.param('id');
      if (!id) {
        return c.json({ error: 'ID is required' }, 400);
      }
      const body = await c.req.json();
      const updated = await talentService.updateTalent(id, body);
      return c.json({ talent: updated });
    } catch (err: any) {
      return c.json({ error: err.message || 'Failed to update talent' }, 400);
    }
  });

  return router;
}
