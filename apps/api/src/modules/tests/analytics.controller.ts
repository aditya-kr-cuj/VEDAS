import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import { getLeaderboard, getStudentPerformance, getTestAnalytics } from './analytics.repository.js';
import { findStudentProfileByUserId } from '../students/student.repository.js';

export async function testAnalyticsHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');
  const analytics = await getTestAnalytics({ tenantId, testId: req.params.id });
  if (!analytics) throw new HttpError(404, 'Test not found');
  res.status(200).json({ analytics });
}

export async function leaderboardHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');
  const leaderboard = await getLeaderboard({ tenantId, testId: req.params.id });
  res.status(200).json({ leaderboard });
}

export async function studentPerformanceHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId || !userId) throw new HttpError(400, 'Tenant context is required');
  const student = await findStudentProfileByUserId(tenantId, userId);
  if (!student) throw new HttpError(404, 'Student profile not found');
  const performance = await getStudentPerformance({ tenantId, studentId: student.id });
  res.status(200).json({ performance });
}
