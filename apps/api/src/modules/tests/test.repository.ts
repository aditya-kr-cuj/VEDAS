import { query, withTransaction } from '../../db/client.js';
import { HttpError } from '../../utils/http-error.js';

export async function createTest(payload: {
  tenantId: string;
  title: string;
  description?: string;
  courseId: string;
  batchId: string;
  createdBy: string;
  testType: string;
  totalMarks: number;
  passingMarks: number;
  durationMinutes: number;
  startTime?: string;
  endTime?: string;
  instructions?: string;
  allowReview: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResultImmediately: boolean;
  negativeMarking: number;
  questionIds: string[];
}) {
  return withTransaction(async (client) => {
    const rows = await client.query(
      `
        INSERT INTO tests (
          tenant_id, title, description, course_id, batch_id, created_by, test_type,
          total_marks, passing_marks, duration_minutes, start_time, end_time, instructions,
          allow_review, shuffle_questions, shuffle_options, show_result_immediately, negative_marking
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
        RETURNING *
      `,
      [
        payload.tenantId,
        payload.title,
        payload.description ?? null,
        payload.courseId,
        payload.batchId,
        payload.createdBy,
        payload.testType,
        payload.totalMarks,
        payload.passingMarks,
        payload.durationMinutes,
        payload.startTime ?? null,
        payload.endTime ?? null,
        payload.instructions ?? null,
        payload.allowReview,
        payload.shuffleQuestions,
        payload.shuffleOptions,
        payload.showResultImmediately,
        payload.negativeMarking
      ]
    );

    const test = rows.rows[0];

    if (payload.questionIds.length > 0) {
      const values = payload.questionIds
        .map((_, idx) => `($1,$${idx * 2 + 2},$${idx * 2 + 3})`)
        .join(', ');
      const params: Array<string | number> = [test.id];
      payload.questionIds.forEach((id, index) => {
        params.push(id, index + 1);
      });
      await client.query(
        `
          INSERT INTO test_questions (test_id, question_id, question_order)
          VALUES ${values}
        `,
        params
      );
    }

    return test;
  });
}

export async function listTests(payload: {
  tenantId: string;
  courseId?: string;
  batchId?: string;
  status?: string;
  createdBy?: string;
}) {
  const where: string[] = ['tenant_id = $1'];
  const values: Array<string> = [payload.tenantId];
  let idx = values.length + 1;
  if (payload.courseId) {
    where.push(`course_id = $${idx++}`);
    values.push(payload.courseId);
  }
  if (payload.batchId) {
    where.push(`batch_id = $${idx++}`);
    values.push(payload.batchId);
  }
  if (payload.status) {
    where.push(`status = $${idx++}`);
    values.push(payload.status);
  }
  if (payload.createdBy) {
    where.push(`created_by = $${idx++}`);
    values.push(payload.createdBy);
  }

  return query(
    `
      SELECT *
      FROM tests
      WHERE ${where.join(' AND ')}
      ORDER BY created_at DESC
    `,
    values
  );
}

export async function getTestById(payload: { tenantId: string; testId: string }) {
  const [test] = await query(
    `
      SELECT *
      FROM tests
      WHERE tenant_id = $1 AND id = $2
      LIMIT 1
    `,
    [payload.tenantId, payload.testId]
  );
  if (!test) return null;

  const questions = await query(
    `
      SELECT tq.question_id, tq.question_order, tq.marks_override, q.question_text, q.question_type, q.marks
      FROM test_questions tq
      JOIN question_bank q ON q.id = tq.question_id
      WHERE tq.test_id = $1
      ORDER BY tq.question_order ASC
    `,
    [payload.testId]
  );

  return { test, questions };
}

export async function updateTest(payload: {
  tenantId: string;
  testId: string;
  fields: Record<string, any>;
  questionIds?: string[];
}) {
  return withTransaction(async (client) => {
    const setClauses: string[] = [];
    const values: Array<any> = [];
    let idx = 1;

    Object.entries(payload.fields).forEach(([key, value]) => {
      if (value === undefined) return;
      setClauses.push(`${key} = $${idx++}`);
      values.push(value);
    });

    if (setClauses.length) {
      values.push(payload.tenantId, payload.testId);
      await client.query(
        `
          UPDATE tests
          SET ${setClauses.join(', ')}, updated_at = NOW()
          WHERE tenant_id = $${idx} AND id = $${idx + 1}
        `,
        values
      );
    }

    if (payload.questionIds) {
      await client.query(`DELETE FROM test_questions WHERE test_id = $1`, [payload.testId]);
      const values2 = payload.questionIds
        .map((_, i) => `($1,$${i * 2 + 2},$${i * 2 + 3})`)
        .join(', ');
      const params: Array<string | number> = [payload.testId];
      payload.questionIds.forEach((id, index) => {
        params.push(id, index + 1);
      });
      if (payload.questionIds.length > 0) {
        await client.query(
          `
            INSERT INTO test_questions (test_id, question_id, question_order)
            VALUES ${values2}
          `,
          params
        );
      }
    }
  });
}

export async function deleteTest(payload: { tenantId: string; testId: string }) {
  await query(`DELETE FROM tests WHERE tenant_id = $1 AND id = $2`, [payload.tenantId, payload.testId]);
}

export async function publishTest(payload: { tenantId: string; testId: string; status: string }) {
  await query(
    `
      UPDATE tests
      SET status = $1, updated_at = NOW()
      WHERE tenant_id = $2 AND id = $3
    `,
    [payload.status, payload.tenantId, payload.testId]
  );
}

export async function calculateTotalMarks(payload: { questionIds: string[] }) {
  if (payload.questionIds.length === 0) return 0;
  const [row] = await query<{ total: string }>(
    `
      SELECT COALESCE(SUM(marks),0)::text AS total
      FROM question_bank
      WHERE id = ANY($1::uuid[])
    `,
    [payload.questionIds]
  );
  return Number(row?.total ?? 0);
}

export async function ensureQuestionsBelongToCourse(payload: { tenantId: string; courseId: string; ids: string[] }) {
  if (payload.ids.length === 0) return;
  const rows = await query(
    `
      SELECT COUNT(*)::int AS count
      FROM question_bank
      WHERE tenant_id = $1 AND course_id = $2 AND id = ANY($3::uuid[]) AND is_deleted = FALSE
    `,
    [payload.tenantId, payload.courseId, payload.ids]
  );
  if (rows[0]?.count !== payload.ids.length) {
    throw new HttpError(400, 'Some questions do not belong to this course');
  }
}
