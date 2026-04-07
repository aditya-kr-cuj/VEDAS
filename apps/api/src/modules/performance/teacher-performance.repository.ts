import { query } from '../../db/client.js';

export async function getTeacherPerformance(payload: { tenantId: string; teacherId: string }) {
  const [teacher] = await query<{ id: string; user_id: string }>(
    `SELECT id, user_id FROM teachers WHERE tenant_id = $1 AND id = $2`,
    [payload.tenantId, payload.teacherId]
  );
  if (!teacher) return null;

  const [classes] = await query<{ total: string }>(
    `
      SELECT COUNT(*)::text AS total
      FROM timetable_entries
      WHERE tenant_id = $1 AND teacher_id = $2
    `,
    [payload.tenantId, payload.teacherId]
  );

  const [avgScore] = await query<{ avg: string }>(
    `
      SELECT COALESCE(AVG(ta.percentage),0)::text AS avg
      FROM tests t
      JOIN test_attempts ta ON ta.test_id = t.id
      WHERE t.tenant_id = $1 AND t.created_by = $2 AND ta.status IN ('submitted','evaluated')
    `,
    [payload.tenantId, payload.teacherId]
  );

  const [materials] = await query<{ total: string }>(
    `
      SELECT COUNT(*)::text AS total
      FROM study_materials
      WHERE tenant_id = $1 AND uploaded_by = $2 AND is_deleted = FALSE
    `,
    [payload.tenantId, teacher.user_id]
  );

  const [tests] = await query<{ total: string }>(
    `
      SELECT COUNT(*)::text AS total
      FROM tests
      WHERE tenant_id = $1 AND created_by = $2
    `,
    [payload.tenantId, payload.teacherId]
  );

  const [pending] = await query<{ total: string }>(
    `
      SELECT COUNT(*)::text AS total
      FROM test_answers a
      JOIN question_bank q ON q.id = a.question_id
      JOIN test_attempts ta ON ta.id = a.attempt_id
      JOIN tests t ON t.id = ta.test_id
      WHERE t.tenant_id = $1 AND t.created_by = $2
        AND q.question_type = 'subjective'
        AND a.marks_obtained IS NULL
    `,
    [payload.tenantId, payload.teacherId]
  );

  return {
    classes_conducted: Number(classes?.total ?? 0),
    average_student_score: Math.round(Number(avgScore?.avg ?? 0) * 10) / 10,
    materials_uploaded: Number(materials?.total ?? 0),
    tests_created: Number(tests?.total ?? 0),
    pending_evaluations: Number(pending?.total ?? 0)
  };
}

export async function listTeachersPerformance(payload: { tenantId: string }) {
  return query(
    `
      SELECT
        t.id AS teacher_id,
        u.full_name AS teacher_name,
        COALESCE(AVG(ta.percentage),0)::numeric(6,2) AS average_student_score,
        COUNT(DISTINCT te.id)::int AS classes_conducted,
        COUNT(DISTINCT sm.id)::int AS materials_uploaded,
        COUNT(DISTINCT ts.id)::int AS tests_created,
        SUM(CASE WHEN q.question_type = 'subjective' AND a.marks_obtained IS NULL THEN 1 ELSE 0 END)::int AS pending_evaluations,
        DENSE_RANK() OVER (ORDER BY COALESCE(AVG(ta.percentage),0) DESC) AS rank
      FROM teachers t
      JOIN users u ON u.id = t.user_id
      LEFT JOIN tests ts ON ts.created_by = t.id AND ts.tenant_id = $1
      LEFT JOIN test_attempts ta ON ta.test_id = ts.id AND ta.status IN ('submitted','evaluated')
      LEFT JOIN timetable_entries te ON te.teacher_id = t.id AND te.tenant_id = $1
      LEFT JOIN study_materials sm ON sm.uploaded_by = t.user_id AND sm.tenant_id = $1 AND sm.is_deleted = FALSE
      LEFT JOIN test_answers a ON a.attempt_id = ta.id
      LEFT JOIN question_bank q ON q.id = a.question_id
      WHERE t.tenant_id = $1
      GROUP BY t.id, u.full_name
      ORDER BY average_student_score DESC
    `,
    [payload.tenantId]
  );
}
