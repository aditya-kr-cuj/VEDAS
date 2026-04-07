import { query } from '../../db/client.js';

export async function registerToken(payload: {
  userId: string;
  token: string;
  platform: string;
}) {
  await query(
    `
      INSERT INTO device_tokens (user_id, token, platform)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, token) DO NOTHING
    `,
    [payload.userId, payload.token, payload.platform]
  );
}

export async function unregisterToken(payload: { userId: string; token: string }) {
  await query(
    `DELETE FROM device_tokens WHERE user_id = $1 AND token = $2`,
    [payload.userId, payload.token]
  );
}

export async function getTokensByUserIds(userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return [];
  const placeholders = userIds.map((_, i) => `$${i + 1}`).join(',');
  const rows = await query<{ token: string }>(
    `SELECT token FROM device_tokens WHERE user_id IN (${placeholders})`,
    userIds
  );
  return rows.map((r) => r.token);
}

export async function getTokensByTenant(tenantId: string): Promise<string[]> {
  const rows = await query<{ token: string }>(
    `
      SELECT dt.token
      FROM device_tokens dt
      JOIN users u ON u.id = dt.user_id
      WHERE u.tenant_id = $1
    `,
    [tenantId]
  );
  return rows.map((r) => r.token);
}

export async function listUserTokens(userId: string) {
  return query(
    `SELECT id, token, platform, created_at FROM device_tokens WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
}
