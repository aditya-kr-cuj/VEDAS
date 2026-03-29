import { query } from '../../db/client.js';

interface PasswordResetRecord {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
}

export async function createPasswordResetToken(payload: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}): Promise<void> {
  await query(
    `
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
    `,
    [payload.userId, payload.tokenHash, payload.expiresAt]
  );
}

export async function findValidPasswordResetToken(
  tokenHash: string
): Promise<PasswordResetRecord | null> {
  const rows = await query<PasswordResetRecord>(
    `
      SELECT *
      FROM password_reset_tokens
      WHERE token_hash = $1
      AND used_at IS NULL
      AND expires_at > NOW()
      LIMIT 1
    `,
    [tokenHash]
  );

  return rows[0] ?? null;
}

export async function markPasswordResetUsed(tokenHash: string): Promise<void> {
  await query('UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = $1', [tokenHash]);
}
