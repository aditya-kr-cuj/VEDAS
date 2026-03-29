import { query } from '../../db/client.js';
import { HttpError } from '../../utils/http-error.js';

export interface CourseRecord {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  subject_code: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function createCourse(payload: {
  tenantId: string;
  name: string;
  description?: string;
  subjectCode?: string;
}): Promise<CourseRecord> {
  const rows = await query<CourseRecord>(
    `
      INSERT INTO courses (tenant_id, name, description, subject_code)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [payload.tenantId, payload.name, payload.description ?? null, payload.subjectCode ?? null]
  );

  return rows[0];
}

export async function listCourses(tenantId: string): Promise<CourseRecord[]> {
  return query<CourseRecord>(
    `
      SELECT *
      FROM courses
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `,
    [tenantId]
  );
}

export async function findCourseById(tenantId: string, courseId: string): Promise<CourseRecord | null> {
  const rows = await query<CourseRecord>(
    `
      SELECT *
      FROM courses
      WHERE tenant_id = $1 AND id = $2
      LIMIT 1
    `,
    [tenantId, courseId]
  );

  return rows[0] ?? null;
}

export async function updateCourse(payload: {
  tenantId: string;
  courseId: string;
  name?: string;
  description?: string;
  subjectCode?: string;
  isActive?: boolean;
}): Promise<void> {
  await query(
    `
      UPDATE courses
      SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        subject_code = COALESCE($3, subject_code),
        is_active = COALESCE($4, is_active),
        updated_at = NOW()
      WHERE tenant_id = $5 AND id = $6
    `,
    [
      payload.name ?? null,
      payload.description ?? null,
      payload.subjectCode ?? null,
      payload.isActive ?? null,
      payload.tenantId,
      payload.courseId
    ]
  );
}

export async function deleteCourse(payload: { tenantId: string; courseId: string }): Promise<void> {
  await query('DELETE FROM courses WHERE tenant_id = $1 AND id = $2', [payload.tenantId, payload.courseId]);
}

export async function assignTeacherToCourse(payload: {
  courseId: string;
  teacherUserId: string;
}): Promise<void> {
  const rows = await query<{ id: string }>(
    `
      SELECT t.id
      FROM teachers t
      JOIN courses c ON c.id = $1 AND c.tenant_id = t.tenant_id
      WHERE t.user_id = $2
      LIMIT 1
    `,
    [payload.courseId, payload.teacherUserId]
  );
  if (!rows[0]) {
    throw new HttpError(404, 'Teacher profile not found for this tenant');
  }

  await query(
    `
      INSERT INTO course_teachers (course_id, teacher_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `,
    [payload.courseId, rows[0].id]
  );
}
