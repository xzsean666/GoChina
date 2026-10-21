import { Hono } from 'hono';
import type { InquiryService } from '../services/inquiry.js';
import type { AuthService } from '../services/auth.js';
import { createAuthMiddleware, type AuthEnv } from '../middleware/auth.middleware.js';

export function createInquiryController(inquiryService: InquiryService, authService: AuthService) {
  const router = new Hono<AuthEnv>();

  // Apply auth to all inquiry routes
  router.use('*', createAuthMiddleware(authService));

  // Create inquiry
  router.post('/', async (c) => {
    try {
      const user = c.get('user');
      const body = await c.req.json();

      if (!body.title || !body.message) {
        return c.json({ error: 'Title and message are required' }, 400);
      }

      const inquiry = await inquiryService.createInquiry({
        userId: user.id,
        userEmail: user.email,
        userName: user.email.split('@')[0],
        talentId: body.talentId,
        talentName: body.talentName,
        category: body.category || 'general',
        title: body.title,
        message: body.message,
        budget: body.budget,
        expectedDuration: body.expectedDuration,
        preferredChannel: body.preferredChannel || 'in_app',
        contactInfo: body.contactInfo,
      });

      return c.json({ inquiry }, 201);
    } catch (err: any) {
      return c.json({ error: err.message || 'Failed to submit inquiry' }, 500);
    }
  });

  // List inquiries (user gets own, admin gets all)
  router.get('/', async (c) => {
    try {
      const user = c.get('user');
      const isAdmin = user.role === 'admin';
      const status = c.req.query('status');

      const inquiries = await inquiryService.listInquiries(
        isAdmin ? undefined : user.id,
        status,
        isAdmin
      );

      return c.json({ inquiries });
    } catch (err: any) {
      return c.json({ error: err.message || 'Failed to list inquiries' }, 500);
    }
  });

  // Get single inquiry
  router.get('/:id', async (c) => {
    try {
      const user = c.get('user');
      const id = c.req.param('id');
      const isAdmin = user.role === 'admin';

      const inquiry = await inquiryService.getInquiryById(id, user.id, isAdmin);
      if (!inquiry) {
        return c.json({ error: 'Inquiry not found' }, 404);
      }

      return c.json({ inquiry });
    } catch (err: any) {
      return c.json({ error: err.message || 'Failed to get inquiry' }, 500);
    }
  });

  // Post message to inquiry conversation
  router.post('/:id/messages', async (c) => {
    try {
      const user = c.get('user');
      const id = c.req.param('id');
      const isAdmin = user.role === 'admin';
      const body = await c.req.json();

      if (!body.text || !body.text.trim()) {
        return c.json({ error: 'Message text cannot be empty' }, 400);
      }

      const sender = isAdmin ? 'agent' : 'user';
      const senderName = isAdmin ? 'GoChina Support Agent' : user.email.split('@')[0];

      const updated = await inquiryService.addMessage(
        id,
        sender,
        body.text.trim(),
        senderName,
        user.id,
        isAdmin
      );

      return c.json({ inquiry: updated });
    } catch (err: any) {
      return c.json({ error: err.message || 'Failed to post message' }, 500);
    }
  });

  return router;
}
