import { query, withTransaction } from '../../db/client.js';
import { HttpError } from '../../utils/http-error.js';

export async function listStudentTests(payload: { tenantId: string; studentId: string }) {
  return query(
    `
      SELECT t.*
      FROM tests t
      JOIN batches b ON b.id = t.batch_id
      JOIN batch_students bs ON bs.batch_id = b.id
      WHERE t.tenant_id = $1 AND bs.student_id = $2
      ORDER BY t.start_time ASC NULLS LAST
    `,
    [payload.tenantId, payload.studentId]
  );
}

export async function findAttempt(payload: { testId: string; studentId: string }) {
  const [attempt] = await query(
    `
      SELECT *
      FROM test_attempts
      WHERE test_id = $1 AND student_id = $2
      LIMIT 1
    `,
    [payload.testId, payload.studentId]
  );
  return attempt ?? null;
}

export async function createAttempt(payload: { testId: string; studentId: string }) {
  const rows = await query(
    `
      INSERT INTO test_attempts (test_id, student_id, start_time, status)
      VALUES ($1,$2,NOW(),'in_progress')
      ON CONFLICT (test_id, student_id) DO UPDATE SET updated_at = NOW()
      RETURNING *
    `,
    [payload.testId, payload.studentId]
  );
  return rows[0];
}

export async function getAttemptAnswers(payload: { attemptId: string }) {
  return query(
    `
      SELECT *
      FROM test_answers
      WHERE attempt_id = $1
    `,
    [payload.attemptId]
  );
}

export async function saveAnswer(payload: {
  attemptId: string;
  questionId: string;
  answerData: any;
}) {
  await query(
    `
      INSERT INTO test_answers (attempt_id, question_id, answer_data)
      VALUES ($1,$2,$3::jsonb)
      ON CONFLICT (attempt_id, question_id)
      DO UPDATE SET answer_data = EXCLUDED.answer_data, updated_at = NOW()
    `,
    [payload.attemptId, payload.questionId, JSON.stringify(payload.answerData)]
  );
}

export async function submitAttempt(payload: {
  attemptId: string;
  totalMarks: number;
  obtained: number;
  percentage: number;
  timeTaken: number;
}) {
  await query(
    `
      UPDATE test_attempts
      SET status = 'submitted',
          submit_time = NOW(),
          time_taken_seconds = $1,
          total_marks_obtained = $2,
          percentage = $3,
          updated_at = NOW()
      WHERE id = $4
    `,
    [payload.timeTaken, payload.obtained, payload.percentage, payload.attemptId]
  );
}

export async function getTestWithQuestions(payload: { tenantId: string; testId: string }) {
  const [test] = await query(
    `
      SELECT *
      FROM tests
      WHERE tenant_id = $1 AND id = $2
      LIMIT 1
    `,
    [payload.tenantId, payload.testId]
  );
  if (!test) throw new HttpError(404, 'Test not found');

  const questions = await query(
    `
      SELECT
        q.*,
        tq.question_order,
        tq.marks_override
      FROM test_questions tq
      JOIN question_bank q ON q.id = tq.question_id
      WHERE tq.test_id = $1
      ORDER BY tq.question_order ASC
    `,
    [payload.testId]
  );

  const options = await query(
    `
      SELECT * FROM question_options WHERE question_id = ANY($1::uuid[]) ORDER BY option_order ASC
    `,
    [questions.map((q: any) => q.id)]
  );
  const blanks = await query(
    `
      SELECT * FROM fill_blank_answers WHERE question_id = ANY($1::uuid[])
    `,
    [questions.map((q: any) => q.id)]
  );

  return { test, questions, options, blanks };
}

export async function getResult(payload: { attemptId: string }) {
  const [attempt] = await query(
    `
      SELECT *
      FROM test_attempts
      WHERE id = $1
    `,
    [payload.attemptId]
  );
  if (!attempt) return null;

  const answers = await query(
    `
      SELECT ta.*, q.question_text, q.explanation, q.marks
      FROM test_answers ta
      JOIN question_bank q ON q.id = ta.question_id
      WHERE ta.attempt_id = $1
    `,
    [payload.attemptId]
  );

  return { attempt, answers };
}

export async function gradeAttempt(payload: { attemptId: string; testId: string }) {
  return withTransaction(async (client) => {
    const answers = await client.query(
      `SELECT * FROM test_answers WHERE attempt_id = $1`,
      [payload.attemptId]
    );
    const answerRows = answers.rows;
    const questions = await client.query(
      `SELECT * FROM question_bank WHERE id IN (SELECT question_id FROM test_questions WHERE test_id = $1)`,
      [payload.testId]
    );
    const options = await client.query(
      `SELECT * FROM question_options WHERE question_id IN (SELECT question_id FROM test_questions WHERE test_id = $1)`,
      [payload.testId]
    );
    const blanks = await client.query(
      `SELECT * FROM fill_blank_answers WHERE question_id IN (SELECT question_id FROM test_questions WHERE test_id = $1)`,
      [payload.testId]
    );

    let obtained = 0;
    const overrides = await client.query(
      `SELECT question_id, marks_override FROM test_questions WHERE test_id = $1`,
      [payload.testId]
    );

    for (const question of questions.rows) {
      const answer = answerRows.find((a: any) => a.question_id === question.id);
      if (!answer) continue;
      const override = overrides.rows.find((o: any) => o.question_id === question.id)?.marks_override;
      const maxMarks = override !== null && override !== undefined ? Number(override) : Number(question.marks);
      let isCorrect: boolean | null = null;
      let marks = 0;

      if (question.question_type === 'mcq' || question.question_type === 'true_false') {
        const correct = options.rows.find((o: any) => o.question_id === question.id && o.is_correct);
        const selected = answer.answer_data?.selected_option_id;
        isCorrect = correct && selected === correct.id;
        marks = isCorrect ? maxMarks : 0;
      } else if (question.question_type === 'multi_select') {
        const correctIds = options.rows.filter((o: any) => o.question_id === question.id && o.is_correct).map((o: any) => o.id).sort();
        const selected = (answer.answer_data?.selected_option_ids ?? []).sort();
        isCorrect = JSON.stringify(correctIds) === JSON.stringify(selected);
        marks = isCorrect ? maxMarks : 0;
      } else if (question.question_type === 'fill_blanks') {
        const answersForQuestion = blanks.rows.filter((b: any) => b.question_id === question.id);
        const provided = answer.answer_data?.answers ?? [];
        const allCorrect = answersForQuestion.every((b: any, idx: number) => {
          const expected = b.correct_answer;
          const got = provided[idx] ?? '';
          return b.case_sensitive ? expected === got : expected.toLowerCase() === String(got).toLowerCase();
        });
        isCorrect = allCorrect;
        marks = isCorrect ? maxMarks : 0;
      } else {
        isCorrect = null;
        marks = 0;
      }

      await client.query(
        `
          UPDATE test_answers
          SET is_correct = $1, marks_obtained = $2, updated_at = NOW()
          WHERE id = $3
        `,
        [isCorrect, marks, answer.id]
      );

      obtained += marks;
    }

    return obtained;
  });
}
