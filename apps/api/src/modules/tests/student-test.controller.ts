import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import {
  createAttempt,
  findAttempt,
  getAttemptAnswers,
  getResult,
  getTestWithQuestions,
  gradeAttempt,
  listStudentTests,
  saveAnswer,
  submitAttempt
} from './student-test.repository.js';
import { findStudentProfileByUserId } from '../students/student.repository.js';

function shuffleArray<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

export async function listStudentTestsHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId || !userId) throw new HttpError(400, 'Tenant context is required');
  const student = await findStudentProfileByUserId(tenantId, userId);
  if (!student) throw new HttpError(404, 'Student profile not found');

  const tests = await listStudentTests({ tenantId, studentId: student.id });
  res.status(200).json({ tests });
}

export async function startTestHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId || !userId) throw new HttpError(400, 'Tenant context is required');
  const student = await findStudentProfileByUserId(tenantId, userId);
  if (!student) throw new HttpError(404, 'Student profile not found');

  const { test, questions, options, blanks } = await getTestWithQuestions({ tenantId, testId: req.params.id });

  const now = new Date();
  if (test.start_time && now < new Date(test.start_time)) {
    throw new HttpError(400, 'Test not started yet');
  }
  if (test.end_time && now > new Date(test.end_time)) {
    throw new HttpError(400, 'Test has ended');
  }

  const attempt = await createAttempt({ testId: test.id, studentId: student.id });
  const answers = await getAttemptAnswers({ attemptId: attempt.id });

  let orderedQuestions = questions;
  if (test.shuffle_questions) {
    orderedQuestions = shuffleArray(questions);
  }

  const responseQuestions = orderedQuestions.map((q: any) => ({
    ...q,
    options: test.shuffle_options ? shuffleArray(options.filter((o: any) => o.question_id === q.id)) : options.filter((o: any) => o.question_id === q.id),
    blanks: blanks.filter((b: any) => b.question_id === q.id)
  }));

  res.status(200).json({ attempt, test, questions: responseQuestions, answers });
}

export async function saveAnswerHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId || !userId) throw new HttpError(400, 'Tenant context is required');
  const student = await findStudentProfileByUserId(tenantId, userId);
  if (!student) throw new HttpError(404, 'Student profile not found');

  const attempt = await findAttempt({ testId: req.params.id, studentId: student.id });
  if (!attempt) throw new HttpError(404, 'Attempt not found');

  if (attempt.status !== 'in_progress') {
    throw new HttpError(400, 'Attempt already submitted');
  }

  await saveAnswer({
    attemptId: attempt.id,
    questionId: req.body.question_id,
    answerData: req.body.answer_data
  });

  res.status(200).json({ message: 'Saved' });
}

export async function submitTestHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId || !userId) throw new HttpError(400, 'Tenant context is required');
  const student = await findStudentProfileByUserId(tenantId, userId);
  if (!student) throw new HttpError(404, 'Student profile not found');

  const attempt = await findAttempt({ testId: req.params.id, studentId: student.id });
  if (!attempt) throw new HttpError(404, 'Attempt not found');
  if (attempt.status !== 'in_progress') throw new HttpError(400, 'Attempt already submitted');

  const obtained = await gradeAttempt({ attemptId: attempt.id, testId: req.params.id });
  const { test } = await getTestWithQuestions({ tenantId, testId: req.params.id });
  const totalMarks = Number(test.total_marks ?? 0);
  const percentage = totalMarks > 0 ? Math.round((obtained / totalMarks) * 100) : 0;
  const timeTaken = req.body.time_taken_seconds ?? 0;

  await submitAttempt({
    attemptId: attempt.id,
    obtained,
    totalMarks,
    percentage,
    timeTaken
  });

  if (test.show_result_immediately) {
    const result = await getResult({ attemptId: attempt.id });
    res.status(200).json({ result });
    return;
  }

  res.status(200).json({ message: 'Submitted' });
}

export async function getResultHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId || !userId) throw new HttpError(400, 'Tenant context is required');
  const student = await findStudentProfileByUserId(tenantId, userId);
  if (!student) throw new HttpError(404, 'Student profile not found');

  const attempt = await findAttempt({ testId: req.params.id, studentId: student.id });
  if (!attempt) throw new HttpError(404, 'Attempt not found');

  const result = await getResult({ attemptId: attempt.id });
  res.status(200).json({ result });
}
