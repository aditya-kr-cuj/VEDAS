import { query, withTransaction } from '../../db/client.js';
import { HttpError } from '../../utils/http-error.js';

export type QuestionType = 'mcq' | 'true_false' | 'subjective' | 'fill_blanks' | 'multi_select';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface QuestionRecord {
  id: string;
  tenant_id: string;
  course_id: string;
  topic: string | null;
  question_text: string;
  question_type: QuestionType;
  difficulty_level: DifficultyLevel;
  marks: string;
  created_by: string;
  media_url: string | null;
  explanation: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  option_order: number;
}

export interface FillBlankAnswer {
  id: string;
  question_id: string;
  blank_position: number;
  correct_answer: string;
  case_sensitive: boolean;
}

export interface SubjectiveRubric {
  id: string;
  question_id: string;
  rubric_text: string;
  max_marks: string;
}

export async function createQuestion(payload: {
  tenantId: string;
  courseId: string;
  topic?: string;
  questionText: string;
  questionType: QuestionType;
  difficultyLevel: DifficultyLevel;
  marks: number;
  createdByTeacherId: string;
  mediaUrl?: string;
  explanation?: string;
}): Promise<QuestionRecord> {
  const rows = await query<QuestionRecord>(
    `
      INSERT INTO question_bank (
        tenant_id, course_id, topic, question_text, question_type, difficulty_level,
        marks, created_by, media_url, explanation
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `,
    [
      payload.tenantId,
      payload.courseId,
      payload.topic ?? null,
      payload.questionText,
      payload.questionType,
      payload.difficultyLevel,
      payload.marks,
      payload.createdByTeacherId,
      payload.mediaUrl ?? null,
      payload.explanation ?? null
    ]
  );
  return rows[0];
}

export async function addOptions(payload: {
  questionId: string;
  options: Array<{ text: string; isCorrect: boolean; order: number }>;
}) {
  if (!payload.options.length) return;
  const values = payload.options
    .map((opt, idx) => `($1,$${idx * 3 + 2},$${idx * 3 + 3},$${idx * 3 + 4})`)
    .join(', ');
  const params: Array<string | boolean | number> = [payload.questionId];
  payload.options.forEach((opt) => {
    params.push(opt.text, opt.isCorrect, opt.order);
  });

  await query(
    `
      INSERT INTO question_options (question_id, option_text, is_correct, option_order)
      VALUES ${values}
    `,
    params
  );
}

export async function addFillBlankAnswers(payload: {
  questionId: string;
  answers: Array<{ blankPosition: number; correctAnswer: string; caseSensitive: boolean }>;
}) {
  if (!payload.answers.length) return;
  const values = payload.answers
    .map((ans, idx) => `($1,$${idx * 3 + 2},$${idx * 3 + 3},$${idx * 3 + 4})`)
    .join(', ');
  const params: Array<string | number | boolean> = [payload.questionId];
  payload.answers.forEach((ans) => {
    params.push(ans.blankPosition, ans.correctAnswer, ans.caseSensitive);
  });

  await query(
    `
      INSERT INTO fill_blank_answers (question_id, blank_position, correct_answer, case_sensitive)
      VALUES ${values}
    `,
    params
  );
}

export async function addSubjectiveRubric(payload: {
  questionId: string;
  rubricText: string;
  maxMarks: number;
}) {
  const rows = await query<SubjectiveRubric>(
    `
      INSERT INTO subjective_rubric (question_id, rubric_text, max_marks)
      VALUES ($1,$2,$3)
      RETURNING *
    `,
    [payload.questionId, payload.rubricText, payload.maxMarks]
  );
  return rows[0];
}

export async function getQuestionById(payload: { tenantId: string; questionId: string }) {
  const [question] = await query<QuestionRecord>(
    `
      SELECT *
      FROM question_bank
      WHERE tenant_id = $1 AND id = $2
      LIMIT 1
    `,
    [payload.tenantId, payload.questionId]
  );
  if (!question) return null;

  const options = await query<QuestionOption>(
    `SELECT * FROM question_options WHERE question_id = $1 ORDER BY option_order ASC`,
    [payload.questionId]
  );
  const blanks = await query<FillBlankAnswer>(
    `SELECT * FROM fill_blank_answers WHERE question_id = $1 ORDER BY blank_position ASC`,
    [payload.questionId]
  );
  const rubrics = await query<SubjectiveRubric>(
    `SELECT * FROM subjective_rubric WHERE question_id = $1 ORDER BY created_at DESC`,
    [payload.questionId]
  );

  return { question, options, blanks, rubrics };
}

export async function listQuestions(payload: {
  tenantId: string;
  courseId?: string;
  topic?: string;
  questionType?: QuestionType;
  difficulty?: DifficultyLevel;
  search?: string;
  createdBy?: string;
  limit?: number;
  offset?: number;
}) {
  const where: string[] = ['tenant_id = $1'];
  const values: Array<string | number> = [payload.tenantId];
  let idx = values.length + 1;

  if (payload.courseId) {
    where.push(`course_id = $${idx++}`);
    values.push(payload.courseId);
  }
  if (payload.topic) {
    where.push(`topic ILIKE $${idx++}`);
    values.push(`%${payload.topic}%`);
  }
  if (payload.questionType) {
    where.push(`question_type = $${idx++}`);
    values.push(payload.questionType);
  }
  if (payload.difficulty) {
    where.push(`difficulty_level = $${idx++}`);
    values.push(payload.difficulty);
  }
  if (payload.search) {
    where.push(`question_text ILIKE $${idx}`);
    values.push(`%${payload.search}%`);
    idx += 1;
  }
  if (payload.createdBy) {
    where.push(`created_by = $${idx++}`);
    values.push(payload.createdBy);
  }

  const limit = payload.limit ?? 50;
  const offset = payload.offset ?? 0;

  return query<QuestionRecord>(
    `
      SELECT *
      FROM question_bank
      WHERE ${where.join(' AND ')} AND is_deleted = FALSE
      ORDER BY created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `,
    [...values, limit, offset]
  );
}

export async function updateQuestion(payload: {
  tenantId: string;
  questionId: string;
  topic?: string;
  questionText?: string;
  questionType?: QuestionType;
  difficultyLevel?: DifficultyLevel;
  marks?: number;
  mediaUrl?: string;
  explanation?: string;
}) {
  const fields: string[] = [];
  const values: Array<string | number> = [];
  let idx = 1;

  if (payload.topic !== undefined) {
    fields.push(`topic = $${idx++}`);
    values.push(payload.topic);
  }
  if (payload.questionText !== undefined) {
    fields.push(`question_text = $${idx++}`);
    values.push(payload.questionText);
  }
  if (payload.questionType !== undefined) {
    fields.push(`question_type = $${idx++}`);
    values.push(payload.questionType);
  }
  if (payload.difficultyLevel !== undefined) {
    fields.push(`difficulty_level = $${idx++}`);
    values.push(payload.difficultyLevel);
  }
  if (payload.marks !== undefined) {
    fields.push(`marks = $${idx++}`);
    values.push(payload.marks);
  }
  if (payload.mediaUrl !== undefined) {
    fields.push(`media_url = $${idx++}`);
    values.push(payload.mediaUrl);
  }
  if (payload.explanation !== undefined) {
    fields.push(`explanation = $${idx++}`);
    values.push(payload.explanation);
  }

  if (fields.length === 0) return;

  values.push(payload.tenantId, payload.questionId);
  await query(
    `
      UPDATE question_bank
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE tenant_id = $${idx} AND id = $${idx + 1} AND is_deleted = FALSE
    `,
    values
  );
}

export async function replaceOptions(payload: {
  questionId: string;
  options: Array<{ text: string; isCorrect: boolean; order: number }>;
}) {
  await withTransaction(async (client) => {
    await client.query(`DELETE FROM question_options WHERE question_id = $1`, [payload.questionId]);
    if (!payload.options.length) return;
    const values = payload.options
      .map((opt, idx) => `($1,$${idx * 3 + 2},$${idx * 3 + 3},$${idx * 3 + 4})`)
      .join(', ');
    const params: Array<string | boolean | number> = [payload.questionId];
    payload.options.forEach((opt) => {
      params.push(opt.text, opt.isCorrect, opt.order);
    });
    await client.query(
      `
        INSERT INTO question_options (question_id, option_text, is_correct, option_order)
        VALUES ${values}
      `,
      params
    );
  });
}

export async function replaceBlanks(payload: {
  questionId: string;
  answers: Array<{ blankPosition: number; correctAnswer: string; caseSensitive: boolean }>;
}) {
  await withTransaction(async (client) => {
    await client.query(`DELETE FROM fill_blank_answers WHERE question_id = $1`, [payload.questionId]);
    if (!payload.answers.length) return;
    const values = payload.answers
      .map((ans, idx) => `($1,$${idx * 3 + 2},$${idx * 3 + 3},$${idx * 3 + 4})`)
      .join(', ');
    const params: Array<string | number | boolean> = [payload.questionId];
    payload.answers.forEach((ans) => {
      params.push(ans.blankPosition, ans.correctAnswer, ans.caseSensitive);
    });
    await client.query(
      `
        INSERT INTO fill_blank_answers (question_id, blank_position, correct_answer, case_sensitive)
        VALUES ${values}
      `,
      params
    );
  });
}

export async function replaceRubric(payload: { questionId: string; rubricText?: string; maxMarks?: number }) {
  await withTransaction(async (client) => {
    await client.query(`DELETE FROM subjective_rubric WHERE question_id = $1`, [payload.questionId]);
    if (!payload.rubricText) return;
    await client.query(
      `
        INSERT INTO subjective_rubric (question_id, rubric_text, max_marks)
        VALUES ($1,$2,$3)
      `,
      [payload.questionId, payload.rubricText, payload.maxMarks ?? 0]
    );
  });
}

export async function softDeleteQuestion(payload: { tenantId: string; questionId: string }) {
  await query(
    `
      UPDATE question_bank
      SET is_deleted = TRUE, updated_at = NOW()
      WHERE tenant_id = $1 AND id = $2
    `,
    [payload.tenantId, payload.questionId]
  );
}

export async function createQuestionWithDetails(payload: {
  tenantId: string;
  courseId: string;
  topic?: string;
  questionText: string;
  questionType: QuestionType;
  difficultyLevel: DifficultyLevel;
  marks: number;
  createdByTeacherId: string;
  mediaUrl?: string;
  explanation?: string;
  options?: Array<{ text: string; isCorrect: boolean; order: number }>;
  blanks?: Array<{ blankPosition: number; correctAnswer: string; caseSensitive: boolean }>;
  rubric?: { rubricText: string; maxMarks: number };
}) {
  return withTransaction(async () => {
    const question = await createQuestion(payload);

    if (payload.options?.length) {
      await addOptions({ questionId: question.id, options: payload.options });
    }
    if (payload.blanks?.length) {
      await addFillBlankAnswers({ questionId: question.id, answers: payload.blanks });
    }
    if (payload.rubric) {
      await addSubjectiveRubric({
        questionId: question.id,
        rubricText: payload.rubric.rubricText,
        maxMarks: payload.rubric.maxMarks
      });
    }

    return question;
  });
}

export async function assertTeacherCourse(payload: {
  tenantId: string;
  teacherId: string;
  courseId: string;
}) {
  const rows = await query(
    `
      SELECT 1
      FROM course_teachers ct
      JOIN teachers t ON t.id = ct.teacher_id
      WHERE t.tenant_id = $1 AND t.id = $2 AND ct.course_id = $3
      LIMIT 1
    `,
    [payload.tenantId, payload.teacherId, payload.courseId]
  );
  if (!rows[0]) {
    throw new HttpError(403, 'Teacher not assigned to this course');
  }
}
