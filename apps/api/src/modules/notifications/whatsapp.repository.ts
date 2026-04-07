import { query } from '../../db/client.js';

// ── WhatsApp Logs ───────────────────────────────────────────────

export async function createWhatsAppLog(payload: {
  tenantId: string;
  recipientPhone: string;
  templateName: string;
  templateParams: string[];
  status: string;
  errorMessage?: string;
}) {
  const rows = await query(
    `
      INSERT INTO whatsapp_logs (tenant_id, recipient_phone, template_name, template_params, status, error_message)
      VALUES ($1,$2,$3,$4::jsonb,$5,$6)
      RETURNING *
    `,
    [
      payload.tenantId,
      payload.recipientPhone,
      payload.templateName,
      JSON.stringify(payload.templateParams),
      payload.status,
      payload.errorMessage ?? null
    ]
  );
  return rows[0];
}

export async function markWhatsAppLogSent(payload: { logId: string; messageId?: string }) {
  await query(
    `UPDATE whatsapp_logs SET status = 'sent', sent_at = NOW(), message_id = $2 WHERE id = $1`,
    [payload.logId, payload.messageId ?? null]
  );
}

export async function markWhatsAppLogFailed(payload: { logId: string; errorMessage: string }) {
  await query(
    `UPDATE whatsapp_logs SET status = 'failed', error_message = $2 WHERE id = $1`,
    [payload.logId, payload.errorMessage]
  );
}

export async function listWhatsAppLogs(payload: {
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
    `SELECT COUNT(*)::text AS count FROM whatsapp_logs WHERE ${whereClause}`,
    values
  );
  const total = Number(countResult[0]?.count ?? 0);

  const limit = payload.limit ?? 25;
  const offset = payload.offset ?? 0;
  const rows = await query(
    `
      SELECT *
      FROM whatsapp_logs
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `,
    values
  );

  return { rows, total };
}

// ── WhatsApp Templates ──────────────────────────────────────────

export async function listTemplates(tenantId: string) {
  return query(
    `SELECT * FROM whatsapp_templates WHERE tenant_id = $1 ORDER BY created_at DESC`,
    [tenantId]
  );
}

export async function createTemplate(payload: {
  tenantId: string;
  name: string;
  language: string;
  bodyText: string;
  paramCount: number;
}) {
  const rows = await query(
    `
      INSERT INTO whatsapp_templates (tenant_id, name, language, body_text, param_count)
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (tenant_id, name) DO UPDATE
        SET language = EXCLUDED.language,
            body_text = EXCLUDED.body_text,
            param_count = EXCLUDED.param_count,
            is_active = TRUE
      RETURNING *
    `,
    [payload.tenantId, payload.name, payload.language, payload.bodyText, payload.paramCount]
  );
  return rows[0];
}

// ── WhatsApp Opt-ins ────────────────────────────────────────────

export async function listOptins(tenantId: string) {
  return query(
    `SELECT * FROM whatsapp_optins WHERE tenant_id = $1 ORDER BY opted_in_at DESC`,
    [tenantId]
  );
}

export async function upsertOptin(payload: {
  tenantId: string;
  phone: string;
  optedIn: boolean;
}) {
  await query(
    `
      INSERT INTO whatsapp_optins (tenant_id, phone, opted_in, opted_in_at)
      VALUES ($1,$2,$3,NOW())
      ON CONFLICT (tenant_id, phone)
      DO UPDATE SET opted_in = EXCLUDED.opted_in, opted_in_at = NOW()
    `,
    [payload.tenantId, payload.phone, payload.optedIn]
  );
}

export async function isPhoneOptedIn(tenantId: string, phone: string): Promise<boolean> {
  const rows = await query<{ opted_in: boolean }>(
    `SELECT opted_in FROM whatsapp_optins WHERE tenant_id = $1 AND phone = $2`,
    [tenantId, phone]
  );
  // If no record, not opted-in
  return rows[0]?.opted_in === true;
}
