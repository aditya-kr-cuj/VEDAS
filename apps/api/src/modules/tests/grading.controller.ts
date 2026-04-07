import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import { applyEvaluation, getSubmissionDetails, listSubmissions } from './grading.repository.js';
import { findTeacherProfileByUserId } from '../teachers/teacher.repository.js';

export async function listSubmissionsHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const submissions = await listSubmissions({
    tenantId,
    testId: req.params.id,
    status: req.query.status?.toString()
  });

  res.status(200).json({ submissions });
}

export async function getSubmissionHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');
  const result = await getSubmissionDetails({
    tenantId,
    testId: req.params.testId,
    attemptId: req.params.attemptId
  });
  res.status(200).json(result);
}

export async function evaluateSubmissionHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId || !userId) throw new HttpError(400, 'Tenant context is required');
  const teacher = await findTeacherProfileByUserId(tenantId, userId);
  if (!teacher) throw new HttpError(403, 'Teacher profile not found');

  const evaluations = req.body.evaluations ?? [];
  if (!Array.isArray(evaluations) || evaluations.length === 0) {
    throw new HttpError(400, 'evaluations are required');
  }

  const status = await applyEvaluation({
    attemptId: req.params.attemptId,
    teacherId: teacher.id,
    evaluations: evaluations.map((item: any) => ({
      answerId: item.answer_id ?? item.answerId,
      marks: Number(item.marks_obtained ?? item.marksObtained),
      feedback: item.feedback
    }))
  });

  res.status(200).json({ message: 'Evaluation saved', status });
}
