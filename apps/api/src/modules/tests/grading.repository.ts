import { query, withTransaction } from '../../db/client.js';

export async function listSubmissions(payload: { tenantId: string; testId: string; status?: string }) {
  const where: string[] = ['ta.test_id = $1', 't.tenant_id = $2'];
  const values: Array<string> = [payload.testId, payload.tenantId];
  let idx = values.length + 1;
  if (payload.status) {
    where.push(`ta.status = $${idx++}`);
    values.push(payload.status);
  }

  return query(
    `
      SELECT
        ta.*,
        u.full_name AS student_name,
        u.email AS student_email,
        (
          SELECT COUNT(*)
          FROM test_answers a
          JOIN question_bank q ON q.id = a.question_id
          WHERE a.attempt_id = ta.id AND q.question_type = 'subjective' AND a.marks_obtained IS NULL
        ) AS subjective_pending
      FROM test_attempts ta
      JOIN students s ON s.id = ta.student_id
      JOIN users u ON u.id = s.user_id
      JOIN tests t ON t.id = ta.test_id
      WHERE ${where.join(' AND ')}
      ORDER BY ta.created_at DESC
    `,
    values
  );
}

export async function getSubmissionDetails(payload: { tenantId: string; testId: string; attemptId: string }) {
  const [attempt] = await query(
    `
      SELECT ta.*, u.full_name AS student_name, u.email AS student_email
      FROM test_attempts ta
      JOIN students s ON s.id = ta.student_id
      JOIN users u ON u.id = s.user_id
      JOIN tests t ON t.id = ta.test_id
      WHERE ta.id = $1 AND ta.test_id = $2 AND t.tenant_id = $3
    `,
    [payload.attemptId, payload.testId, payload.tenantId]
  );

  const answers = await query(
    `
      SELECT
        a.*,
        q.question_text,
        q.question_type,
        q.marks,
        r.rubric_text,
        r.max_marks
      FROM test_answers a
      JOIN question_bank q ON q.id = a.question_id
      LEFT JOIN subjective_rubric r ON r.question_id = q.id
      WHERE a.attempt_id = $1
    `,
    [payload.attemptId]
  );

  return { attempt, answers };
}

export async function applyEvaluation(payload: {
  attemptId: string;
  teacherId: string;
  evaluations: Array<{ answerId: string; marks: number; feedback?: string }>;
}) {
  return withTransaction(async (client) => {
    for (const evaluation of payload.evaluations) {
      await client.query(
        `
          UPDATE test_answers
          SET marks_obtained = $1, feedback = $2, evaluated_by = $3, updated_at = NOW()
          WHERE id = $4
        `,
        [evaluation.marks, evaluation.feedback ?? null, payload.teacherId, evaluation.answerId]
      );
    }

    const [sum] = await client.query<{ total: string }>(
      `
        SELECT COALESCE(SUM(marks_obtained),0)::text AS total
        FROM test_answers
        WHERE attempt_id = $1
      `,
      [payload.attemptId]
    );

    const [pending] = await client.query<{ count: string }>(
      `
        SELECT COUNT(*)::text AS count
        FROM test_answers a
        JOIN question_bank q ON q.id = a.question_id
        WHERE a.attempt_id = $1 AND q.question_type = 'subjective' AND a.marks_obtained IS NULL
      `,
      [payload.attemptId]
    );

    const status = Number(pending?.count ?? 0) === 0 ? 'evaluated' : 'submitted';
    await client.query(
      `
        UPDATE test_attempts
        SET total_marks_obtained = $1, status = $2, updated_at = NOW()
        WHERE id = $3
      `,
      [Number(sum?.total ?? 0), status, payload.attemptId]
    );

    return status;
  });
}
