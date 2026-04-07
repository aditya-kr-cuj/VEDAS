import { query } from '../../db/client.js';

// ── SMS Logs ────────────────────────────────────────────────────

export async function createSmsLog(payload: {
  tenantId: string;
  recipientPhone: string;
  message: string;
  status: string;
  creditsUsed?: number;
  errorMessage?: string;
}) {
  const rows = await query(
    `
      INSERT INTO sms_logs (tenant_id, recipient_phone, message, status, credits_used, error_message)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
    `,
    [
      payload.tenantId,
      payload.recipientPhone,
      payload.message,
      payload.status,
      payload.creditsUsed ?? 1,
      payload.errorMessage ?? null
    ]
  );
  return rows[0];
}

export async function markSmsLogSent(payload: { logId: string }) {
  await query(
    `UPDATE sms_logs SET status = 'sent', sent_at = NOW() WHERE id = $1`,
    [payload.logId]
  );
}

export async function markSmsLogFailed(payload: { logId: string; errorMessage: string }) {
  await query(
    `UPDATE sms_logs SET status = 'failed', error_message = $2 WHERE id = $1`,
    [payload.logId, payload.errorMessage]
  );
}

export async function listSmsLogs(payload: {
  tenantId: string;
  status?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}): Promise<{ rows: any[]; total: number }> {
  const where: string[] = ['tenant_id = $1'];
  const values: Array<string | number> = [payload.tenantId];
  let idx = 2;

  if (payload.status) {
    where.push(`status = $${idx++}`);
    values.push(payload.status);
  }
  if (payload.from) {
    where.push(`created_at >= $${idx++}::timestamptz`);
    values.push(payload.from);
  }
  if (payload.to) {
    where.push(`created_at <= $${idx++}::timestamptz`);
    values.push(payload.to);
  }

  const whereClause = where.join(' AND ');

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM sms_logs WHERE ${whereClause}`,
    values
  );
  const total = Number(countResult[0]?.count ?? 0);

  const limit = payload.limit ?? 25;
  const offset = payload.offset ?? 0;
  const rows = await query(
    `
      SELECT *
      FROM sms_logs
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `,
    values
  );

  return { rows, total };
}

// ── SMS Credits ─────────────────────────────────────────────────

export async function getTenantCredits(tenantId: string) {
  const rows = await query<{
    tenant_id: string;
    total_credits: number;
    used_credits: number;
    low_credit_threshold: number;
    updated_at: string;
  }>(
    `SELECT * FROM tenant_sms_credits WHERE tenant_id = $1`,
    [tenantId]
  );
  return rows[0] ?? null;
}

export async function initTenantCredits(tenantId: string, initialCredits = 0) {
  await query(
    `
      INSERT INTO tenant_sms_credits (tenant_id, total_credits)
      VALUES ($1, $2)
      ON CONFLICT (tenant_id) DO NOTHING
    `,
    [tenantId, initialCredits]
  );
}

export async function deductCredits(tenantId: string, amount = 1): Promise<boolean> {
  // Atomic deduction — only succeeds if sufficient balance
  const result = await query<{ tenant_id: string }>(
    `
      UPDATE tenant_sms_credits
      SET used_credits = used_credits + $2, updated_at = NOW()
      WHERE tenant_id = $1 AND (total_credits - used_credits) >= $2
      RETURNING tenant_id
    `,
    [tenantId, amount]
  );
  return result.length > 0;
}

export async function addCredits(tenantId: string, amount: number) {
  // Ensure row exists first
  await initTenantCredits(tenantId, 0);

  await query(
    `
      UPDATE tenant_sms_credits
      SET total_credits = total_credits + $2, updated_at = NOW()
      WHERE tenant_id = $1
    `,
    [tenantId, amount]
  );

  return getTenantCredits(tenantId);
}
