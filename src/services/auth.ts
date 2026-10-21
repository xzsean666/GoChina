import { SignJWT, jwtVerify } from 'jose';
import { verifyMessage } from 'viem';
import type { DatabaseClient } from '../db/client.js';
import type { UserRole, UserData } from '../types/models.js';
import type { AuthContextUser, LoginResult, SendOtpResult } from '../types/auth.js';

export interface AuthServiceConfig {
  jwtSecret: string;
  jwtIssuer?: string;
  jwtAudience?: string;
  tokenExpiresIn?: string;
  environment?: string;
}

export class AuthService {
  private secretKey: Uint8Array;

  constructor(
    private db: DatabaseClient,
    private cacheKv: KVNamespace,
    private config: AuthServiceConfig
  ) {
    this.secretKey = new TextEncoder().encode(config.jwtSecret);
  }

  async sendOtp(email: string): Promise<SendOtpResult> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw new Error('Invalid email address');
    }

    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const otp = (100000 + (array[0]! % 900000)).toString();
    const kvKey = `otp:${normalizedEmail}`;
    await this.cacheKv.put(kvKey, otp, { expirationTtl: 300 });

    const isDev = this.config.environment === 'test' || this.config.environment === 'development';
    return {
      success: true,
      email: normalizedEmail,
      devOtp: isDev ? otp : undefined,
    };
  }

  async verifyOtpAndLogin(email: string, otp: string): Promise<LoginResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const kvKey = `otp:${normalizedEmail}`;
    const attemptKey = `otp_attempts:${normalizedEmail}`;
    
    const attempts = parseInt((await this.cacheKv.get(attemptKey)) || '0', 10);
    if (attempts >= 5) {
      await this.cacheKv.delete(kvKey);
      await this.cacheKv.delete(attemptKey);
      throw new Error('Too many failed OTP attempts. Please request a new code.');
    }

    const storedOtp = await this.cacheKv.get(kvKey);

    if (!storedOtp || storedOtp !== otp) {
      await this.cacheKv.put(attemptKey, (attempts + 1).toString(), { expirationTtl: 300 });
      throw new Error('Invalid or expired OTP');
    }

    await this.cacheKv.delete(kvKey);
    await this.cacheKv.delete(attemptKey);

    let userRecord = await this.db.users.getBy('email', normalizedEmail);
    let isNewUser = false;
    let userId: string;
    let role: UserRole = 'user';

    if (!userRecord) {
      isNewUser = true;
      const randBytes = new Uint8Array(6);
      crypto.getRandomValues(randBytes);
      const randHex = Array.from(randBytes, (b) => b.toString(16).padStart(2, '0')).join('');
      userId = `usr_${Date.now()}_${randHex}`;
      const userData: UserData = {
        email: normalizedEmail,
        name: normalizedEmail.split('@')[0],
        role: 'user',
        status: 'active',
      };
      await this.db.users.set(userId, userData, {
        keys: {
          email: normalizedEmail,
          role: 'user',
          status: 'active',
        },
      });
      await this.db.users.flush();
    } else {
      userId = String(userRecord.key);
      role = (userRecord.role as UserRole) || 'user';
      if (userRecord.status === 'suspended') {
        throw new Error('User account is suspended');
      }
    }

    const authUser: AuthContextUser = {
      id: userId,
      email: normalizedEmail,
      role,
      walletAddress: userRecord?.walletAddress,
    };

    const token = await this.issueSessionToken(authUser);
    return {
      token,
      user: authUser,
      isNewUser,
    };
  }

  async verifyWalletAndLogin(address: string, signature?: string, message?: string): Promise<LoginResult> {
    const normalizedAddress = address.trim().toLowerCase();
    if (!/^0x[a-f0-9]{40}$/.test(normalizedAddress)) {
      throw new Error('Invalid Ethereum wallet address format');
    }

    if (!signature || !message) {
      throw new Error('Web3 signature and message are required');
    }

    // Validate timestamp in signed message to prevent delayed replay attacks
    const match = message.match(/at\s+(\d+)/);
    if (!match) {
      throw new Error('Invalid signature message format: missing timestamp');
    }

    const messageTimestamp = parseInt(match[1]!, 10);
    const now = Date.now();
    // 10 minutes tolerance window
    if (Math.abs(now - messageTimestamp) > 10 * 60 * 1000) {
      throw new Error('Signature expired. Please re-authenticate.');
    }

    // Anti-replay protection: prevent reusing identical signature within validity window
    const sigKey = `sig_seen:${normalizedAddress}:${signature.slice(0, 32)}`;
    const alreadySeen = await this.cacheKv.get(sigKey);
    if (alreadySeen) {
      throw new Error('Signature has already been used (replay detected)');
    }
    await this.cacheKv.put(sigKey, '1', { expirationTtl: 600 });

    // Verify ECDSA signature against the provided Ethereum address
    let isValid = false;
    try {
      isValid = await verifyMessage({
        address: normalizedAddress as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });
    } catch {
      isValid = false;
    }

    if (!isValid) {
      throw new Error('Invalid Web3 wallet signature');
    }

    let userRecord = await this.db.users.getBy('walletAddress', normalizedAddress);
    let isNewUser = false;
    let userId: string;
    let role: UserRole = 'user';
    let email: string;

    if (!userRecord) {
      isNewUser = true;
      const randBytes = new Uint8Array(6);
      crypto.getRandomValues(randBytes);
      const randHex = Array.from(randBytes, (b) => b.toString(16).padStart(2, '0')).join('');
      userId = `usr_w_${Date.now()}_${randHex}`;
      email = `${normalizedAddress.slice(0, 8)}@wallet.gochina.io`;
      const userData: UserData = {
        email,
        name: `Wallet ${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)}`,
        walletAddress: normalizedAddress,
        role: 'user',
        status: 'active',
      };
      await this.db.users.set(userId, userData, {
        keys: {
          email,
          walletAddress: normalizedAddress,
          role: 'user',
          status: 'active',
        },
      });
      await this.db.users.flush();
    } else {
      userId = String(userRecord.key);
      email = userRecord.email;
      role = (userRecord.role as UserRole) || 'user';
      if (userRecord.status === 'suspended') {
        throw new Error('User account is suspended');
      }
    }

    const authUser: AuthContextUser = {
      id: userId,
      email,
      role,
      walletAddress: normalizedAddress,
    };

    const token = await this.issueSessionToken(authUser);
    return {
      token,
      user: authUser,
      isNewUser,
    };
  }

  async issueSessionToken(user: AuthContextUser): Promise<string> {
    return await new SignJWT({
      email: user.email,
      role: user.role,
      walletAddress: user.walletAddress,
    })
      .setSubject(user.id)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer(this.config.jwtIssuer ?? 'gochina-portal')
      .setAudience(this.config.jwtAudience ?? 'gochina-users')
      .setExpirationTime(this.config.tokenExpiresIn ?? '7d')
      .sign(this.secretKey);
  }

  async verifySessionToken(token: string): Promise<AuthContextUser> {
    try {
      const { payload } = await jwtVerify(token, this.secretKey, {
        issuer: this.config.jwtIssuer ?? 'gochina-portal',
        audience: this.config.jwtAudience ?? 'gochina-users',
      });

      const userId = payload.sub;
      if (!userId) {
        throw new Error('Missing sub in token');
      }

      const user = await this.db.users.get(userId);
      if (!user) {
        throw new Error('User not found');
      }
      if (user.status === 'suspended') {
        throw new Error('User account is suspended');
      }

      return {
        id: userId,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
      };
    } catch (err: any) {
      throw new Error(`Invalid session token: ${err.message}`);
    }
  }
}
