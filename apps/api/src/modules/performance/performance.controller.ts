import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import { getStudentPerformanceOverview, getSubjectPerformance } from './performance.repository.js';
import { findStudentProfileByUserId } from '../students/student.repository.js';

export async function performanceOverviewHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  if (req.role === 'student') {
    const student = await findStudentProfileByUserId(tenantId, userId ?? '');
    if (!student || student.id !== req.params.id) {
      throw new HttpError(403, 'Access denied');
    }
  }

  const overview = await getStudentPerformanceOverview({
    tenantId,
    studentId: req.params.id
  });
  res.status(200).json(overview);
}

export async function subjectPerformanceHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  if (req.role === 'student') {
    const student = await findStudentProfileByUserId(tenantId, userId ?? '');
    if (!student || student.id !== req.params.id) {
      throw new HttpError(403, 'Access denied');
    }
  }

  const result = await getSubjectPerformance({
    tenantId,
    studentId: req.params.id,
    courseId: req.params.courseId
  });
  res.status(200).json(result);
}
