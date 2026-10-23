import { SignJWT } from 'jose';
import type { Pay3ClientConfig } from './types.js';

export async function generatePay3Token(
  config: Pay3ClientConfig,
  scopes: string[]
): Promise<string> {
  const secretKey = new TextEncoder().encode(config.jwtSecret);
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({
    scope: scopes.join(' '),
  })
    .setProtectedHeader({ alg: 'HS256', kid: config.jwtKeyId || 'pay3-dev-key-1' })
    .setIssuedAt(now - 60)
    .setNotBefore(now - 60)
    .setSubject(config.jwtSubject || 'gochina-portal')
    .setIssuer(config.jwtIssuer || 'pay3')
    .setAudience(config.jwtAudience || 'pay3-api')
    .setExpirationTime(now + 3600)
    .sign(secretKey);
}
