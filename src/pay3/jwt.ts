import { SignJWT } from 'jose';
import type { Pay3ClientConfig } from './types.js';

export async function generatePay3Token(
  config: Pay3ClientConfig,
  scopes: string[]
): Promise<string> {
  const secretKey = new TextEncoder().encode(config.jwtSecret);
  return await new SignJWT({
    scope: scopes.join(' '),
  })
    .setProtectedHeader({ alg: 'HS256', kid: config.jwtKeyId || 'pay3-key-1' })
    .setIssuedAt()
    .setSubject(config.jwtSubject || 'gochina-portal')
    .setIssuer(config.jwtIssuer || 'pay3')
    .setAudience(config.jwtAudience || 'pay3-api')
    .setExpirationTime('1h')
    .sign(secretKey);
}
