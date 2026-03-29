import { query } from '../../db/client.js';

interface RefreshTokenRecord {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  is_revoked: boolean;
}

export async function createRefreshToken(payload: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}): Promise<void> {
  await query(
    `
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
    `,
    [payload.userId, payload.tokenHash, payload.expiresAt]
  );
}

export async function findValidRefreshToken(tokenHash: string): Promise<RefreshTokenRecord | null> {
  const rows = await query<RefreshTokenRecord>(
    `
      SELECT *
      FROM refresh_tokens
      WHERE token_hash = $1
      AND is_revoked = FALSE
      AND expires_at > NOW()
      LIMIT 1
    `,
    [tokenHash]
  );

  return rows[0] ?? null;
}

export async function revokeRefreshTokenByHash(tokenHash: string): Promise<void> {
  await query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE token_hash = $1', [tokenHash]);
}

export async function revokeAllRefreshTokensForUser(userId: string): Promise<void> {
  await query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1', [userId]);
}
