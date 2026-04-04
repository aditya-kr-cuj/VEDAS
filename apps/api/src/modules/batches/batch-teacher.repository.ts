import { query, withTransaction } from '../../db/client.js';
import { HttpError } from '../../utils/http-error.js';

export interface BatchTeacherRecord {
  id: string;
  tenant_id: string;
  batch_id: string;
  teacher_user_id: string;
  course_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function assignTeacherToBatch(payload: {
  tenantId: string;
  batchId: string;
  teacherUserId: string;
  courseId?: string;
}): Promise<BatchTeacherRecord> {
  return withTransaction(async (client) => {
    const batchRows = await client.query<{ id: string }>(
      `SELECT id FROM batches WHERE id = $1 AND tenant_id = $2 LIMIT 1`,
      [payload.batchId, payload.tenantId]
    );
    if (!batchRows.rows[0]) {
      throw new HttpError(404, 'Batch not found');
    }

    const teacherRows = await client.query<{ id: string }>(
      `
        SELECT id
        FROM users
        WHERE id = $1 AND tenant_id = $2 AND role = 'teacher'
        LIMIT 1
      `,
      [payload.teacherUserId, payload.tenantId]
    );
    if (!teacherRows.rows[0]) {
      throw new HttpError(404, 'Teacher not found');
    }

    if (payload.courseId) {
      const courseRows = await client.query<{ id: string }>(
        `SELECT id FROM courses WHERE id = $1 AND tenant_id = $2 LIMIT 1`,
        [payload.courseId, payload.tenantId]
      );
      if (!courseRows.rows[0]) {
        throw new HttpError(404, 'Course not found');
      }
    }

    const existing = await client.query<{ id: string }>(
      `
        SELECT id
        FROM batch_teachers
        WHERE tenant_id = $1 AND batch_id = $2 AND teacher_user_id = $3
          AND (course_id IS NOT DISTINCT FROM $4)
        LIMIT 1
      `,
      [payload.tenantId, payload.batchId, payload.teacherUserId, payload.courseId ?? null]
    );
    if (existing.rows[0]) {
      throw new HttpError(409, 'Teacher already assigned to batch');
    }

    const inserted = await client.query<BatchTeacherRecord>(
      `
        INSERT INTO batch_teachers (tenant_id, batch_id, teacher_user_id, course_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [payload.tenantId, payload.batchId, payload.teacherUserId, payload.courseId ?? null]
    );

    return inserted.rows[0];
  });
}

export async function removeTeacherFromBatch(payload: {
  tenantId: string;
  batchId: string;
  teacherUserId: string;
}): Promise<void> {
  const rows = await query<{ id: string }>(
    `
      DELETE FROM batch_teachers
      WHERE tenant_id = $1 AND batch_id = $2 AND teacher_user_id = $3
      RETURNING id
    `,
    [payload.tenantId, payload.batchId, payload.teacherUserId]
  );

  if (!rows[0]) {
    throw new HttpError(404, 'Batch-teacher assignment not found');
  }
}

export async function listTeachersForBatch(payload: {
  tenantId: string;
  batchId: string;
}): Promise<
  Array<{
    teacherUserId: string;
    fullName: string;
    email: string;
    courseId: string | null;
    courseName: string | null;
    assignedAt: Date;
  }>
> {
  return query(
    `
      SELECT
        bt.teacher_user_id AS "teacherUserId",
        u.full_name AS "fullName",
        u.email AS "email",
        bt.course_id AS "courseId",
        c.name AS "courseName",
        bt.created_at AS "assignedAt"
      FROM batch_teachers bt
      JOIN users u ON u.id = bt.teacher_user_id AND u.tenant_id = bt.tenant_id
      LEFT JOIN courses c ON c.id = bt.course_id AND c.tenant_id = bt.tenant_id
      WHERE bt.tenant_id = $1 AND bt.batch_id = $2
      ORDER BY bt.created_at DESC
    `,
    [payload.tenantId, payload.batchId]
  );
}

export async function listBatchesForTeacher(payload: {
  tenantId: string;
  teacherUserId: string;
}): Promise<
  Array<{
    batchId: string;
    batchName: string;
    courseId: string | null;
    courseName: string | null;
    assignedAt: Date;
  }>
> {
  return query(
    `
      SELECT
        b.id AS "batchId",
        b.name AS "batchName",
        bt.course_id AS "courseId",
        c.name AS "courseName",
        bt.created_at AS "assignedAt"
      FROM batch_teachers bt
      JOIN batches b ON b.id = bt.batch_id AND b.tenant_id = bt.tenant_id
      LEFT JOIN courses c ON c.id = bt.course_id AND c.tenant_id = bt.tenant_id
      WHERE bt.tenant_id = $1 AND bt.teacher_user_id = $2
      ORDER BY bt.created_at DESC
    `,
    [payload.tenantId, payload.teacherUserId]
  );
}
