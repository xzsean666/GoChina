import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { privateKeyToAccount } from 'viem/accounts';
import { createDatabase, type DatabaseClient } from '../src/db/client.js';
import { AuthService } from '../src/services/auth.js';
import { createAuthMiddleware, type AuthEnv } from '../src/middleware/auth.middleware.js';
import { createMockEnv, createMockExecutionContext } from './setup.js';

describe('AuthService & AuthMiddleware (TASK-004)', () => {
  let db: DatabaseClient;
  let authService: AuthService;
  let mockEnv: ReturnType<typeof createMockEnv>;

  beforeEach(async () => {
    mockEnv = createMockEnv();
    const ctx = createMockExecutionContext();
    db = createDatabase(mockEnv, ctx);
    await db.init();

    authService = new AuthService(db, mockEnv.CACHE_KV, {
      jwtSecret: mockEnv.PORTAL_JWT_SECRET,
      environment: 'test',
    });
  });

  describe('OTP Authentication', () => {
    it('sends OTP and stores in KV', async () => {
      const result = await authService.sendOtp('alice@example.com');
      expect(result.success).toBe(true);
      expect(result.email).toBe('alice@example.com');
      expect(result.devOtp).toMatch(/^\d{6}$/);

      const stored = await mockEnv.CACHE_KV.get('otp:alice@example.com');
      expect(stored).toBe(result.devOtp);
    });

    it('rejects invalid email address', async () => {
      await expect(authService.sendOtp('invalid-email')).rejects.toThrow('Invalid email address');
    });

    it('rejects invalid OTP', async () => {
      await authService.sendOtp('bob@example.com');
      await expect(authService.verifyOtpAndLogin('bob@example.com', '000000')).rejects.toThrow('Invalid or expired OTP');
    });

    it('registers a new user upon first valid OTP verification', async () => {
      const { devOtp } = await authService.sendOtp('carol@example.com');
      const loginRes = await authService.verifyOtpAndLogin('carol@example.com', devOtp!);

      expect(loginRes.isNewUser).toBe(true);
      expect(loginRes.user.email).toBe('carol@example.com');
      expect(loginRes.user.role).toBe('user');
      expect(loginRes.token).toBeDefined();

      // Check user saved in database with O(1) getBy
      const userInDb = await db.users.getBy('email', 'carol@example.com');
      expect(userInDb).not.toBeNull();
      expect(userInDb?.name).toBe('carol');
      expect(userInDb?.role).toBe('user');

      // Subsequent login is not a new user
      const { devOtp: secondOtp } = await authService.sendOtp('carol@example.com');
      const secondLogin = await authService.verifyOtpAndLogin('carol@example.com', secondOtp!);
      expect(secondLogin.isNewUser).toBe(false);
      expect(secondLogin.user.id).toBe(loginRes.user.id);
    });
  });

  describe('Web3 Wallet Authentication', () => {
    const testAccount = privateKeyToAccount(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    );
    const address = testAccount.address;

    it('authenticates and creates user with valid Ethereum address and signature', async () => {
      const message = `Sign in to GoChina Portal at ${Date.now()}`;
      const signature = await testAccount.signMessage({ message });
      const result = await authService.verifyWalletAndLogin(address, signature, message);

      expect(result.isNewUser).toBe(true);
      expect(result.user.walletAddress).toBe(address.toLowerCase());
      expect(result.token).toBeDefined();

      const userInDb = await db.users.getBy('walletAddress', address.toLowerCase());
      expect(userInDb).not.toBeNull();
      expect(userInDb?.key).toBe(result.user.id);
    });

    it('rejects authentication with missing or invalid signature', async () => {
      await expect(authService.verifyWalletAndLogin(address)).rejects.toThrow(
        'Web3 signature and message are required'
      );

      const message = `Sign in to GoChina Portal at ${Date.now()}`;
      await expect(
        authService.verifyWalletAndLogin(address, '0xinvalid_sig', message)
      ).rejects.toThrow('Invalid Web3 wallet signature');
    });

    it('rejects expired signature timestamp', async () => {
      const expiredTimestamp = Date.now() - 15 * 60 * 1000; // 15 mins ago
      const message = `Sign in to GoChina Portal at ${expiredTimestamp}`;
      const signature = await testAccount.signMessage({ message });

      await expect(
        authService.verifyWalletAndLogin(address, signature, message)
      ).rejects.toThrow('Signature expired');
    });

    it('rejects replay of identical signature', async () => {
      const message = `Sign in to GoChina Portal at ${Date.now()}`;
      const signature = await testAccount.signMessage({ message });

      const firstLogin = await authService.verifyWalletAndLogin(address, signature, message);
      expect(firstLogin.token).toBeDefined();

      await expect(
        authService.verifyWalletAndLogin(address, signature, message)
      ).rejects.toThrow('replay detected');
    });

    it('rejects malformed Ethereum address', async () => {
      await expect(authService.verifyWalletAndLogin('0xinvalid')).rejects.toThrow(
        'Invalid Ethereum wallet address format'
      );
    });
  });

  describe('Session Token Verification & Suspended Users', () => {
    it('verifies session token and retrieves user', async () => {
      const { devOtp } = await authService.sendOtp('dave@example.com');
      const { token, user } = await authService.verifyOtpAndLogin('dave@example.com', devOtp!);

      const verifiedUser = await authService.verifySessionToken(token);
      expect(verifiedUser.id).toBe(user.id);
      expect(verifiedUser.email).toBe('dave@example.com');
      expect(verifiedUser.role).toBe('user');
    });

    it('rejects suspended user', async () => {
      const { devOtp } = await authService.sendOtp('eve@example.com');
      const { token, user } = await authService.verifyOtpAndLogin('eve@example.com', devOtp!);

      // Suspend user
      await db.users.set(user.id, {
        email: 'eve@example.com',
        role: 'user',
        status: 'suspended',
      }, {
        keys: {
          email: 'eve@example.com',
          role: 'user',
          status: 'suspended',
        },
      });
      await db.users.flush();

      await expect(authService.verifySessionToken(token)).rejects.toThrow('User account is suspended');
    });
  });

  describe('Auth Middleware & RBAC', () => {
    it('guards protected routes and handles role restrictions', async () => {
      const app = new Hono<AuthEnv>();

      app.get('/public', (c) => c.text('public content'));
      app.get('/protected', createAuthMiddleware(authService), (c) => {
        const user = c.get('user');
        return c.json({ user });
      });
      app.get('/admin', createAuthMiddleware(authService, { requiredRole: 'admin' }), (c) => {
        const user = c.get('user');
        return c.json({ user, admin: true });
      });

      // 1. Public route works without auth
      const resPublic = await app.request('/public');
      expect(resPublic.status).toBe(200);

      // 2. Protected route rejects without token
      const resNoAuth = await app.request('/protected');
      expect(resNoAuth.status).toBe(401);

      // 3. Protected route works with user token
      const { devOtp } = await authService.sendOtp('user@example.com');
      const userLogin = await authService.verifyOtpAndLogin('user@example.com', devOtp!);

      const resUser = await app.request('/protected', {
        headers: { Authorization: `Bearer ${userLogin.token}` },
      });
      expect(resUser.status).toBe(200);
      const userBody = await resUser.json() as any;
      expect(userBody.user.email).toBe('user@example.com');

      // 4. Normal user gets 403 on admin route
      const resUserAdmin = await app.request('/admin', {
        headers: { Authorization: `Bearer ${userLogin.token}` },
      });
      expect(resUserAdmin.status).toBe(403);

      // 5. Admin user gets 200 on admin route
      const adminId = 'usr_admin_1';
      await db.users.set(adminId, {
        email: 'admin@gochina.io',
        role: 'admin',
        status: 'active',
      }, {
        keys: {
          email: 'admin@gochina.io',
          role: 'admin',
          status: 'active',
        },
      });
      await db.users.flush();

      const adminToken = await authService.issueSessionToken({
        id: adminId,
        email: 'admin@gochina.io',
        role: 'admin',
      });

      const resAdmin = await app.request('/admin', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(resAdmin.status).toBe(200);
      const adminBody = await resAdmin.json() as any;
      expect(adminBody.admin).toBe(true);
    });
  });
});
