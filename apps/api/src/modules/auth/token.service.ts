import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import type { JwtPayload } from '../../types/auth.js';
import { addDays } from '../../utils/date.js';
import { generateSecureToken, sha256 } from '../../utils/crypto.js';
import { createRefreshToken } from './refresh-token.repository.js';

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: `${env.ACCESS_TOKEN_TTL_MIN}m`
  });
}

export async function issueRefreshToken(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const rawToken = generateSecureToken();
  const tokenHash = sha256(rawToken);
  const expiresAt = addDays(new Date(), env.REFRESH_TOKEN_TTL_DAYS);

  await createRefreshToken({ userId, tokenHash, expiresAt });

  return { token: rawToken, expiresAt };
}
