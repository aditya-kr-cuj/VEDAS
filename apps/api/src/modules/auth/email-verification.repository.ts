import { query } from '../../db/client.js';

interface EmailVerificationRecord {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  verified_at: Date | null;
}

export async function createEmailVerificationToken(payload: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}): Promise<void> {
  await query(
    `
      INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
    `,
    [payload.userId, payload.tokenHash, payload.expiresAt]
  );
}

export async function findValidEmailVerificationToken(
  tokenHash: string
): Promise<EmailVerificationRecord | null> {
  const rows = await query<EmailVerificationRecord>(
    `
      SELECT *
      FROM email_verification_tokens
      WHERE token_hash = $1
      AND verified_at IS NULL
      AND expires_at > NOW()
      LIMIT 1
    `,
    [tokenHash]
  );

  return rows[0] ?? null;
}

export async function markEmailVerified(userId: string): Promise<void> {
  await query('UPDATE users SET email_verified = TRUE, email_verified_at = NOW() WHERE id = $1', [
    userId
  ]);
}

export async function markTokenVerified(tokenHash: string): Promise<void> {
  await query('UPDATE email_verification_tokens SET verified_at = NOW() WHERE token_hash = $1', [tokenHash]);
}
