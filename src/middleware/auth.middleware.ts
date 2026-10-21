import type { Context, Next } from 'hono';
import type { AuthService } from '../services/auth.js';
import type { UserRole } from '../types/models.js';
import type { AuthContextUser } from '../types/auth.js';

export interface AuthVariables {
  user: AuthContextUser;
}

export interface AuthEnv {
  Variables: AuthVariables;
}

export interface AuthMiddlewareOptions {
  requiredRole?: UserRole;
}

export function createAuthMiddleware(authService: AuthService, options?: AuthMiddlewareOptions) {
  return async (c: Context<AuthEnv>, next: Next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized: Missing or invalid Authorization header' }, 401);
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return c.json({ error: 'Unauthorized: Empty token' }, 401);
    }

    try {
      const user = await authService.verifySessionToken(token);
      if (options?.requiredRole && options.requiredRole === 'admin' && user.role !== 'admin') {
        return c.json({ error: 'Forbidden: Admin access required' }, 403);
      }

      c.set('user', user);
      await next();
    } catch (err: any) {
      return c.json({ error: `Unauthorized: ${err.message}` }, 401);
    }
  };
}
