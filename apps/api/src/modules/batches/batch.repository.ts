import { query } from '../../db/client.js';
import { HttpError } from '../../utils/http-error.js';

export interface BatchRecord {
  id: string;
  tenant_id: string;
  course_id: string;
  name: string;
  schedule: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function createBatch(payload: {
  tenantId: string;
  courseId: string;
  name: string;
  schedule?: string;
  startDate?: string;
  endDate?: string;
}): Promise<BatchRecord> {
  const rows = await query<BatchRecord>(
    `
      INSERT INTO batches (tenant_id, course_id, name, schedule, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
    [
      payload.tenantId,
      payload.courseId,
      payload.name,
      payload.schedule ?? null,
      payload.startDate ?? null,
      payload.endDate ?? null
    ]
  );

  return rows[0];
}

export async function listBatches(tenantId: string): Promise<BatchRecord[]> {
  return query<BatchRecord>(
    `
      SELECT *
      FROM batches
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `,
    [tenantId]
  );
}

export async function updateBatch(payload: {
  tenantId: string;
  batchId: string;
  name?: string;
  schedule?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}): Promise<void> {
  await query(
    `
      UPDATE batches
      SET
        name = COALESCE($1, name),
        schedule = COALESCE($2, schedule),
        start_date = COALESCE($3, start_date),
        end_date = COALESCE($4, end_date),
        is_active = COALESCE($5, is_active),
        updated_at = NOW()
      WHERE tenant_id = $6 AND id = $7
    `,
    [
      payload.name ?? null,
      payload.schedule ?? null,
      payload.startDate ?? null,
      payload.endDate ?? null,
      payload.isActive ?? null,
      payload.tenantId,
      payload.batchId
    ]
  );
}

export async function deleteBatch(payload: { tenantId: string; batchId: string }): Promise<void> {
  await query('DELETE FROM batches WHERE tenant_id = $1 AND id = $2', [payload.tenantId, payload.batchId]);
}

export async function assignStudentToBatch(payload: {
  batchId: string;
  studentUserId: string;
}): Promise<void> {
  const rows = await query<{ id: string }>(
    `
      SELECT s.id
      FROM students s
      JOIN batches b ON b.id = $1 AND b.tenant_id = s.tenant_id
      WHERE s.user_id = $2
      LIMIT 1
    `,
    [payload.batchId, payload.studentUserId]
  );
  if (!rows[0]) {
    throw new HttpError(404, 'Student profile not found for this tenant');
  }

  await query(
    `
      INSERT INTO batch_students (batch_id, student_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `,
    [payload.batchId, rows[0].id]
  );
}

export async function listStudentsForBatch(payload: {
  tenantId: string;
  batchId: string;
}): Promise<
  Array<{
    studentUserId: string;
    fullName: string;
    email: string;
    assignedAt: Date;
  }>
> {
  return query(
    `
      SELECT
        u.id AS "studentUserId",
        u.full_name AS "fullName",
        u.email AS "email",
        bs.created_at AS "assignedAt"
      FROM batch_students bs
      JOIN students s ON s.id = bs.student_id
      JOIN users u ON u.id = s.user_id AND u.tenant_id = s.tenant_id
      JOIN batches b ON b.id = bs.batch_id AND b.tenant_id = s.tenant_id
      WHERE b.tenant_id = $1 AND b.id = $2
      ORDER BY bs.created_at DESC
    `,
    [payload.tenantId, payload.batchId]
  );
}
