import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import {
  addFillBlankAnswers,
  addOptions,
  addSubjectiveRubric,
  assertTeacherCourse,
  createQuestion,
  getQuestionById,
  listQuestions,
  replaceBlanks,
  replaceOptions,
  replaceRubric,
  softDeleteQuestion,
  updateQuestion
} from './question-bank.repository.js';
import { findTeacherProfileByUserId } from '../teachers/teacher.repository.js';
import { uploadToS3 } from '../../utils/storage.js';
import { query } from '../../db/client.js';

function parseJsonArray(input: unknown) {
  if (!input) return undefined;
  if (Array.isArray(input)) return input;
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export async function createQuestionHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId || !userId) throw new HttpError(400, 'Tenant context is required');

  let teacher = await findTeacherProfileByUserId(tenantId, userId);
  if (!teacher && req.role === 'institute_admin' && req.body.created_by_teacher_id) {
    const [row] = await query<{ id: string }>(
      `SELECT id FROM teachers WHERE tenant_id = $1 AND id = $2`,
      [tenantId, req.body.created_by_teacher_id]
    );
    if (row) teacher = { id: row.id } as any;
  }
  if (!teacher) throw new HttpError(403, 'Teacher profile not found');

  const courseId = req.body.course_id;
  await assertTeacherCourse({ tenantId, teacherId: teacher.id, courseId });

  let mediaUrl = req.body.media_url as string | undefined;
  if (req.file) {
    const uploaded = await uploadToS3({
      buffer: req.file.buffer,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      tenantId
    });
    mediaUrl = uploaded.url;
  }

  const question = await createQuestion({
    tenantId,
    courseId,
    topic: req.body.topic,
    questionText: req.body.question_text,
    questionType: req.body.question_type,
    difficultyLevel: req.body.difficulty_level,
    marks: Number(req.body.marks),
    createdByTeacherId: teacher.id,
    mediaUrl,
    explanation: req.body.explanation
  });

  const options = parseJsonArray(req.body.options);
  if (options?.length) {
    await addOptions({
      questionId: question.id,
      options: options.map((opt: any, idx: number) => ({
        text: opt.option_text ?? opt.text,
        isCorrect: Boolean(opt.is_correct ?? opt.isCorrect),
        order: opt.option_order ?? opt.order ?? idx + 1
      }))
    });
  }

  const blanks = parseJsonArray(req.body.blanks);
  if (blanks?.length) {
    await addFillBlankAnswers({
      questionId: question.id,
      answers: blanks.map((item: any) => ({
        blankPosition: Number(item.blank_position ?? item.blankPosition),
        correctAnswer: item.correct_answer ?? item.correctAnswer,
        caseSensitive: Boolean(item.case_sensitive ?? item.caseSensitive)
      }))
    });
  }

  if (req.body.rubric_text) {
    await addSubjectiveRubric({
      questionId: question.id,
      rubricText: req.body.rubric_text,
      maxMarks: Number(req.body.rubric_marks ?? 0)
    });
  }

  res.status(201).json({ questionId: question.id });
}

export async function listQuestionsHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');
  let createdBy: string | undefined;
  if (req.role === 'teacher') {
    const teacher = await findTeacherProfileByUserId(tenantId, req.auth?.userId ?? '');
    if (!teacher) throw new HttpError(403, 'Teacher profile not found');
    createdBy = teacher.id;
  }

  const page = Math.max(Number(req.query.page ?? 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit ?? 25), 1), 100);
  const offset = (page - 1) * limit;

  const rows = await listQuestions({
    tenantId,
    courseId: req.query.course_id?.toString(),
    topic: req.query.topic?.toString(),
    questionType: req.query.question_type as any,
    difficulty: req.query.difficulty_level as any,
    search: req.query.search?.toString(),
    createdBy,
    limit,
    offset
  });

  res.status(200).json({ questions: rows, page, limit });
}

export async function getQuestionHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');
  if (req.role === 'teacher') {
    const teacher = await findTeacherProfileByUserId(tenantId, req.auth?.userId ?? '');
    const [owner] = await query<{ created_by: string | null }>(
      `SELECT created_by FROM question_bank WHERE tenant_id = $1 AND id = $2`,
      [tenantId, req.params.id]
    );
    if (!teacher || !owner || owner.created_by !== teacher.id) {
      throw new HttpError(403, 'Access denied');
    }
  }
  const result = await getQuestionById({ tenantId, questionId: req.params.id });
  if (!result) throw new HttpError(404, 'Question not found');
  res.status(200).json(result);
}

export async function updateQuestionHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId || !userId) throw new HttpError(400, 'Tenant context is required');

  let teacher = await findTeacherProfileByUserId(tenantId, userId);
  if (!teacher && req.role === 'institute_admin' && req.body.created_by_teacher_id) {
    const [row] = await query<{ id: string }>(
      `SELECT id FROM teachers WHERE tenant_id = $1 AND id = $2`,
      [tenantId, req.body.created_by_teacher_id]
    );
    if (row) teacher = { id: row.id } as any;
  }
  if (!teacher) throw new HttpError(403, 'Teacher profile not found');

  if (req.role === 'teacher') {
    const [owner] = await query<{ created_by: string | null }>(
      `SELECT created_by FROM question_bank WHERE tenant_id = $1 AND id = $2`,
      [tenantId, req.params.id]
    );
    if (!owner || owner.created_by !== teacher.id) {
      throw new HttpError(403, 'You can only edit your own questions');
    }
  }

  let mediaUrl = req.body.media_url as string | undefined;
  if (req.file) {
    const uploaded = await uploadToS3({
      buffer: req.file.buffer,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      tenantId
    });
    mediaUrl = uploaded.url;
  }

  await updateQuestion({
    tenantId,
    questionId: req.params.id,
    topic: req.body.topic,
    questionText: req.body.question_text,
    questionType: req.body.question_type,
    difficultyLevel: req.body.difficulty_level,
    marks: req.body.marks !== undefined ? Number(req.body.marks) : undefined,
    mediaUrl,
    explanation: req.body.explanation
  });

  const options = parseJsonArray(req.body.options);
  if (options) {
    await replaceOptions({
      questionId: req.params.id,
      options: options.map((opt: any, idx: number) => ({
        text: opt.option_text ?? opt.text,
        isCorrect: Boolean(opt.is_correct ?? opt.isCorrect),
        order: opt.option_order ?? opt.order ?? idx + 1
      }))
    });
  }

  const blanks = parseJsonArray(req.body.blanks);
  if (blanks) {
    await replaceBlanks({
      questionId: req.params.id,
      answers: blanks.map((item: any) => ({
        blankPosition: Number(item.blank_position ?? item.blankPosition),
        correctAnswer: item.correct_answer ?? item.correctAnswer,
        caseSensitive: Boolean(item.case_sensitive ?? item.caseSensitive)
      }))
    });
  }

  if (req.body.rubric_text !== undefined) {
    await replaceRubric({
      questionId: req.params.id,
      rubricText: req.body.rubric_text,
      maxMarks: Number(req.body.rubric_marks ?? 0)
    });
  }

  res.status(200).json({ message: 'Question updated' });
}

export async function deleteQuestionHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');
  if (req.role === 'teacher') {
    const userId = req.auth?.userId;
    const teacher = userId ? await findTeacherProfileByUserId(tenantId, userId) : null;
    const [owner] = await query<{ created_by: string | null }>(
      `SELECT created_by FROM question_bank WHERE tenant_id = $1 AND id = $2`,
      [tenantId, req.params.id]
    );
    if (!teacher || !owner || owner.created_by !== teacher.id) {
      throw new HttpError(403, 'You can only delete your own questions');
    }
  }
  await softDeleteQuestion({ tenantId, questionId: req.params.id });
  res.status(200).json({ message: 'Question deleted' });
}

function parseOptionsColumn(input: string) {
  if (!input) return [];
  try {
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Accept pipe-separated, * marks correct: "*4|3|5"
    return input.split('|').map((raw, idx) => ({
      option_text: raw.replace(/^\*/, '').trim(),
      is_correct: raw.trim().startsWith('*'),
      option_order: idx + 1
    }));
  }
  return [];
}

export async function bulkImportHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId || !userId) throw new HttpError(400, 'Tenant context is required');
  let teacher = await findTeacherProfileByUserId(tenantId, userId);
  if (!teacher && req.role === 'institute_admin' && req.body.created_by_teacher_id) {
    const [row] = await query<{ id: string }>(
      `SELECT id FROM teachers WHERE tenant_id = $1 AND id = $2`,
      [tenantId, req.body.created_by_teacher_id]
    );
    if (row) teacher = { id: row.id } as any;
  }
  if (!teacher) throw new HttpError(403, 'Teacher profile not found');
  const file = req.file;
  if (!file) throw new HttpError(400, 'File is required');

  const rows: any[] = [];
  if (file.originalname.endsWith('.csv')) {
    const text = file.buffer.toString('utf8');
    const [headerLine, ...dataLines] = text.split(/\r?\n/).filter(Boolean);
    const headers = headerLine.split(',').map((h) => h.trim());
    for (const line of dataLines) {
      const cols = line.split(',').map((c) => c.trim());
      const row: any = {};
      headers.forEach((h, idx) => (row[h] = cols[idx]));
      rows.push(row);
    }
  } else {
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as any[];
    rows.push(...data);
  }

  const errors: Array<{ row: number; error: string }> = [];
  let success = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    try {
      const courseId = row.course_id || row.courseId;
      await assertTeacherCourse({ tenantId, teacherId: teacher.id, courseId });
      const question = await createQuestion({
        tenantId,
        courseId,
        topic: row.topic ?? null,
        questionText: row.question_text ?? row.questionText,
        questionType: row.question_type ?? row.questionType,
        difficultyLevel: row.difficulty_level ?? row.difficultyLevel,
        marks: Number(row.marks ?? 1),
        createdByTeacherId: teacher.id,
        mediaUrl: row.media_url ?? row.mediaUrl,
        explanation: row.explanation ?? null
      });

      const options = parseOptionsColumn(row.options ?? '');
      if (options.length) {
        await addOptions({
          questionId: question.id,
          options: options.map((opt: any, idx: number) => ({
            text: opt.option_text ?? opt.text,
            isCorrect: Boolean(opt.is_correct ?? opt.isCorrect),
            order: opt.option_order ?? opt.order ?? idx + 1
          }))
        });
      }

      success += 1;
    } catch (error) {
      errors.push({ row: i + 2, error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  res.status(200).json({ total: rows.length, success, failed: errors.length, errors });
}
