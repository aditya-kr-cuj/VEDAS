import type { PoolClient } from 'pg';
import { query, withTransaction } from '../../db/client.js';
import { HttpError } from '../../utils/http-error.js';

export interface StudentRecord {
  id: string;
  tenant_id: string;
  user_id: string | null;
  roll_number: string | null;
  class_name: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function createStudentProfile(
  client: PoolClient,
  payload: { tenantId: string; userId: string }
): Promise<StudentRecord> {
  const result = await client.query<StudentRecord>(
    `
      INSERT INTO students (tenant_id, user_id)
      VALUES ($1, $2)
      RETURNING *
    `,
    [payload.tenantId, payload.userId]
  );

  return result.rows[0];
}

export async function findStudentProfileByUserId(
  tenantId: string,
  userId: string
): Promise<StudentRecord | null> {
  const rows = await query<StudentRecord>(
    `
      SELECT *
      FROM students
      WHERE tenant_id = $1 AND user_id = $2
      LIMIT 1
    `,
    [tenantId, userId]
  );

  return rows[0] ?? null;
}

export async function resolveStudentProfileId(
  tenantId: string,
  id: string
): Promise<string | null> {
  const rows = await query<{ id: string }>(
    `
      SELECT id
      FROM students
      WHERE tenant_id = $1 AND (id = $2 OR user_id = $2)
      LIMIT 1
    `,
    [tenantId, id]
  );

  return rows[0]?.id ?? null;
}

export async function resolveStudentProfileIds(
  tenantId: string,
  ids: string[]
): Promise<string[]> {
  const resolved: string[] = [];
  for (const id of ids) {
    const profileId = await resolveStudentProfileId(tenantId, id);
    if (!profileId) {
      throw new HttpError(404, `Student profile not found: ${id}`);
    }
    resolved.push(profileId);
  }
  return resolved;
}

export interface StudentProfile {
  id: string;
  tenantId: string;
  userId: string | null;
  fullName: string | null;
  email: string | null;
  isActive: boolean | null;
  rollNumber: string | null;
  className: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function listStudentSummaries(tenantId: string) {
  return query(
    `
      SELECT s.id, u.full_name, u.email
      FROM students s
      JOIN users u ON u.id = s.user_id
      WHERE s.tenant_id = $1 AND u.is_active = TRUE
      ORDER BY u.full_name ASC
    `,
    [tenantId]
  );
}

export async function findBatchForStudent(payload: { tenantId: string; studentId: string }) {
  const rows = await query(
    `
      SELECT
        b.id AS batch_id,
        b.name AS batch_name,
        c.id AS course_id,
        c.name AS course_name,
        bs.created_at AS assigned_at
      FROM batch_students bs
      JOIN batches b ON b.id = bs.batch_id
      LEFT JOIN courses c ON c.id = b.course_id
      WHERE b.tenant_id = $1 AND bs.student_id = $2
      ORDER BY bs.created_at DESC
      LIMIT 1
    `,
    [payload.tenantId, payload.studentId]
  );

  return rows[0] ?? null;
}

export async function findStudentById(tenantId: string, studentId: string): Promise<StudentProfile | null> {
  const rows = await query<{
    id: string;
    tenant_id: string;
    user_id: string | null;
    full_name: string | null;
    email: string | null;
    is_active: boolean | null;
    roll_number: string | null;
    class_name: string | null;
    guardian_name: string | null;
    guardian_phone: string | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `
      SELECT
        s.id,
        s.tenant_id,
        s.user_id,
        u.full_name,
        u.email,
        u.is_active,
        s.roll_number,
        s.class_name,
        s.guardian_name,
        s.guardian_phone,
        s.created_at,
        s.updated_at
      FROM students s
      LEFT JOIN users u ON u.id = s.user_id AND u.tenant_id = s.tenant_id
      WHERE s.tenant_id = $1 AND s.id = $2
      LIMIT 1
    `,
    [tenantId, studentId]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    fullName: row.full_name,
    email: row.email,
    isActive: row.is_active,
    rollNumber: row.roll_number,
    className: row.class_name,
    guardianName: row.guardian_name,
    guardianPhone: row.guardian_phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function updateStudentProfile(payload: {
  tenantId: string;
  studentId: string;
  fullName?: string;
  email?: string;
  rollNumber?: string;
  className?: string;
  guardianName?: string;
  guardianPhone?: string;
}): Promise<StudentProfile> {
  return withTransaction(async (client) => {
    const studentRows = await client.query<{
      id: string;
      user_id: string | null;
    }>(
      `
        SELECT id, user_id
        FROM students
        WHERE tenant_id = $1 AND id = $2
        LIMIT 1
      `,
      [payload.tenantId, payload.studentId]
    );

    const student = studentRows.rows[0];
    if (!student) {
      throw new HttpError(404, 'Student not found');
    }

    if (student.user_id) {
      if (payload.fullName || payload.email) {
        await client.query(
          `
            UPDATE users
            SET
              full_name = COALESCE($1, full_name),
              email = COALESCE($2, email),
              updated_at = NOW()
            WHERE id = $3 AND tenant_id = $4
          `,
          [
            payload.fullName ?? null,
            payload.email ? payload.email.toLowerCase() : null,
            student.user_id,
            payload.tenantId
          ]
        );
      }
    }

    await client.query(
      `
        UPDATE students
        SET
          roll_number = COALESCE($1, roll_number),
          class_name = COALESCE($2, class_name),
          guardian_name = COALESCE($3, guardian_name),
          guardian_phone = COALESCE($4, guardian_phone),
          updated_at = NOW()
        WHERE id = $5 AND tenant_id = $6
      `,
      [
        payload.rollNumber ?? null,
        payload.className ?? null,
        payload.guardianName ?? null,
        payload.guardianPhone ?? null,
        payload.studentId,
        payload.tenantId
      ]
    );

    const updated = await client.query<{
      id: string;
      tenant_id: string;
      user_id: string | null;
      full_name: string | null;
      email: string | null;
      is_active: boolean | null;
      roll_number: string | null;
      class_name: string | null;
      guardian_name: string | null;
      guardian_phone: string | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `
        SELECT
          s.id,
          s.tenant_id,
          s.user_id,
          u.full_name,
          u.email,
          u.is_active,
          s.roll_number,
          s.class_name,
          s.guardian_name,
          s.guardian_phone,
          s.created_at,
          s.updated_at
        FROM students s
        LEFT JOIN users u ON u.id = s.user_id AND u.tenant_id = s.tenant_id
        WHERE s.tenant_id = $1 AND s.id = $2
        LIMIT 1
      `,
      [payload.tenantId, payload.studentId]
    );

    const row = updated.rows[0];
    if (!row) {
      throw new HttpError(404, 'Student not found');
    }

    return {
      id: row.id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      fullName: row.full_name,
      email: row.email,
      isActive: row.is_active,
      rollNumber: row.roll_number,
      className: row.class_name,
      guardianName: row.guardian_name,
      guardianPhone: row.guardian_phone,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  });
}

export async function softDeleteStudent(payload: { tenantId: string; studentId: string }): Promise<void> {
  await withTransaction(async (client) => {
    const rows = await client.query<{ user_id: string | null }>(
      `
        SELECT user_id
        FROM students
        WHERE tenant_id = $1 AND id = $2
        LIMIT 1
      `,
      [payload.tenantId, payload.studentId]
    );

    const student = rows.rows[0];
    if (!student) {
      throw new HttpError(404, 'Student not found');
    }

    if (!student.user_id) {
      throw new HttpError(409, 'Student has no linked user account');
    }

    await client.query(
      `
        UPDATE users
        SET is_active = FALSE, updated_at = NOW()
        WHERE id = $1 AND tenant_id = $2
      `,
      [student.user_id, payload.tenantId]
    );
  });
}
