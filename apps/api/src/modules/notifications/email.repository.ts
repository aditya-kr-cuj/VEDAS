import { query } from '../../db/client.js';

export async function createEmailLog(payload: {
  tenantId: string;
  recipientEmail: string;
  subject: string;
  templateName: string;
  status: string;
  errorMessage?: string;
}) {
  const rows = await query(
    `
      INSERT INTO email_logs (tenant_id, recipient_email, subject, template_name, status, error_message)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
    `,
    [
      payload.tenantId,
      payload.recipientEmail,
      payload.subject,
      payload.templateName,
      payload.status,
      payload.errorMessage ?? null
    ]
  );
  return rows[0];
}

export async function markEmailLogSent(payload: { logId: string }) {
  await query(
    `
      UPDATE email_logs
      SET status = 'sent', sent_at = NOW()
      WHERE id = $1
    `,
    [payload.logId]
  );
}

export async function markEmailLogFailed(payload: { logId: string; errorMessage: string }) {
  await query(
    `
      UPDATE email_logs
      SET status = 'failed', error_message = $2
      WHERE id = $1
    `,
    [payload.logId, payload.errorMessage]
  );
}

export async function listEmailLogs(payload: {
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

  // Get total count
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM email_logs WHERE ${whereClause}`,
    values
  );
  const total = Number(countResult[0]?.count ?? 0);

  // Get paginated rows
  const limit = payload.limit ?? 25;
  const offset = payload.offset ?? 0;
  const rows = await query(
    `
      SELECT *
      FROM email_logs
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `,
    values
  );

  return { rows, total };
}

export async function getUserPreferences(payload: { userId: string }) {
  return query(
    `
      SELECT notification_type, email_enabled, sms_enabled
      FROM user_notification_preferences
      WHERE user_id = $1
    `,
    [payload.userId]
  );
}

export async function upsertUserPreference(payload: {
  userId: string;
  notificationType: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
}) {
  await query(
    `
      INSERT INTO user_notification_preferences (user_id, notification_type, email_enabled, sms_enabled)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (user_id, notification_type)
      DO UPDATE SET email_enabled = EXCLUDED.email_enabled, sms_enabled = EXCLUDED.sms_enabled
    `,
    [payload.userId, payload.notificationType, payload.emailEnabled, payload.smsEnabled]
  );
}
