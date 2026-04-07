import { query } from '../../db/client.js';

export interface QrTokenRecord {
  id: string;
  tenant_id: string;
  batch_id: string;
  course_id: string | null;
  time_slot_id: string | null;
  teacher_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
}

export async function createQrToken(payload: {
  tenantId: string;
  batchId: string;
  courseId?: string;
  timeSlotId?: string;
  teacherId: string;
  tokenHash: string;
  expiresAt: Date;
}): Promise<QrTokenRecord> {
  const rows = await query<QrTokenRecord>(
    `
      INSERT INTO attendance_qr_tokens (
        tenant_id, batch_id, course_id, time_slot_id, teacher_id, token_hash, expires_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `,
    [
      payload.tenantId,
      payload.batchId,
      payload.courseId ?? null,
      payload.timeSlotId ?? null,
      payload.teacherId,
      payload.tokenHash,
      payload.expiresAt
    ]
  );
  return rows[0];
}

export async function findValidQrToken(payload: { tenantId: string; tokenHash: string }): Promise<QrTokenRecord | null> {
  const rows = await query<QrTokenRecord>(
    `
      SELECT *
      FROM attendance_qr_tokens
      WHERE tenant_id = $1 AND token_hash = $2 AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [payload.tenantId, payload.tokenHash]
  );
  return rows[0] ?? null;
}
