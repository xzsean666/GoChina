import type { UserRole } from './models.js';

export interface UserSessionPayload {
  sub: string;
  email: string;
  role: UserRole;
  walletAddress?: string;
  iat?: number;
  exp?: number;
}

export interface AuthContextUser {
  id: string;
  email: string;
  role: UserRole;
  walletAddress?: string;
}

export interface LoginResult {
  token: string;
  user: AuthContextUser;
  isNewUser: boolean;
}

export interface SendOtpResult {
  success: boolean;
  email: string;
  devOtp?: string;
}
