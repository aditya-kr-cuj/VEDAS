import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import {
  calculateTotalMarks,
  createTest,
  deleteTest,
  ensureQuestionsBelongToCourse,
  archiveTest,
  getTestById,
  listTests,
  publishTest,
  updateTest
} from './test.repository.js';
import { findTeacherProfileByUserId } from '../teachers/teacher.repository.js';

function parseQuestionIds(input: unknown): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(String);
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return input.split(',').map((id) => id.trim()).filter(Boolean);
    }
  }
  return [];
}

function statusFromTimes(start?: string, end?: string) {
  if (!start || !end) return 'draft';
  const now = new Date();
  const startTime = new Date(start);
  const endTime = new Date(end);
  if (now < startTime) return 'scheduled';
  if (now >= startTime && now <= endTime) return 'ongoing';
  return 'completed';
}

export async function createTestHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId || !userId) throw new HttpError(400, 'Tenant context is required');

  const teacher = await findTeacherProfileByUserId(tenantId, userId);
  if (!teacher) throw new HttpError(403, 'Teacher profile not found');

  const questionIds = parseQuestionIds(req.body.question_ids);
  await ensureQuestionsBelongToCourse({ tenantId, courseId: req.body.course_id, ids: questionIds });

  const totalMarks = req.body.total_marks ?? (await calculateTotalMarks({ questionIds }));

  const test = await createTest({
    tenantId,
    title: req.body.title,
    description: req.body.description,
    courseId: req.body.course_id,
    batchId: req.body.batch_id,
    createdBy: teacher.id,
    testType: req.body.test_type ?? 'quiz',
    totalMarks,
    passingMarks: req.body.passing_marks ?? 0,
    durationMinutes: Number(req.body.duration_minutes),
    startTime: req.body.start_time,
    endTime: req.body.end_time,
    instructions: req.body.instructions,
    allowReview: req.body.allow_review ?? true,
    shuffleQuestions: req.body.shuffle_questions ?? false,
    shuffleOptions: req.body.shuffle_options ?? false,
    showResultImmediately: req.body.show_result_immediately ?? false,
    negativeMarking: Number(req.body.negative_marking ?? 0),
    questionIds
  });

  res.status(201).json({ test });
}

export async function listTestsHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');
  let createdBy: string | undefined;
  if (req.role === 'teacher') {
    const teacher = await findTeacherProfileByUserId(tenantId, req.auth?.userId ?? '');
    if (!teacher) throw new HttpError(403, 'Teacher profile not found');
    createdBy = teacher.id;
  }

  const tests = await listTests({
    tenantId,
    courseId: req.query.course_id?.toString(),
    batchId: req.query.batch_id?.toString(),
    status: req.query.status?.toString(),
    createdBy,
    includeArchived: req.query.include_archived === 'true'
  });

  res.status(200).json({ tests });
}

export async function archiveTestHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');
  const archived = req.body?.archived ?? true;
  await archiveTest({ tenantId, testId: req.params.id, archived });
  res.status(200).json({ message: archived ? 'Test archived' : 'Test restored' });
}

export async function getTestHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');
  const result = await getTestById({ tenantId, testId: req.params.id });
  if (!result) throw new HttpError(404, 'Test not found');
  res.status(200).json(result);
}

export async function updateTestHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId || !userId) throw new HttpError(400, 'Tenant context is required');

  const current = await getTestById({ tenantId, testId: req.params.id });
  if (!current) throw new HttpError(404, 'Test not found');
  if (current.test.status !== 'draft') {
    throw new HttpError(400, 'Only draft tests can be updated');
  }

  const questionIds = req.body.question_ids ? parseQuestionIds(req.body.question_ids) : undefined;
  if (questionIds) {
    await ensureQuestionsBelongToCourse({ tenantId, courseId: req.body.course_id ?? current.test.course_id, ids: questionIds });
  }

  const totalMarks =
    req.body.total_marks !== undefined
      ? Number(req.body.total_marks)
      : questionIds
        ? await calculateTotalMarks({ questionIds })
        : undefined;

  await updateTest({
    tenantId,
    testId: req.params.id,
    fields: {
      title: req.body.title,
      description: req.body.description,
      course_id: req.body.course_id,
      batch_id: req.body.batch_id,
      test_type: req.body.test_type,
      total_marks: totalMarks,
      passing_marks: req.body.passing_marks,
      duration_minutes: req.body.duration_minutes,
      start_time: req.body.start_time,
      end_time: req.body.end_time,
      instructions: req.body.instructions,
      allow_review: req.body.allow_review,
      shuffle_questions: req.body.shuffle_questions,
      shuffle_options: req.body.shuffle_options,
      show_result_immediately: req.body.show_result_immediately,
      negative_marking: req.body.negative_marking
    },
    questionIds
  });

  res.status(200).json({ message: 'Test updated' });
}

export async function deleteTestHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');
  await deleteTest({ tenantId, testId: req.params.id });
  res.status(200).json({ message: 'Test deleted' });
}

export async function publishTestHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');
  const status = statusFromTimes(req.body.start_time ?? req.query.start_time?.toString(), req.body.end_time ?? req.query.end_time?.toString());
  await publishTest({ tenantId, testId: req.params.id, status });
  res.status(200).json({ message: 'Test published', status });
}
