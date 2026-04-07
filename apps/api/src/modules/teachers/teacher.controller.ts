import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import { listBatchesForTeacherService } from '../batches/batch-teacher.service.js';
import { findTeacherProfileByUserId } from './teacher.repository.js';

export async function listTeacherBatchesHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  const batches = await listBatchesForTeacherService({ tenantId, teacherUserId: req.params.id });
  res.status(200).json({ batches });
}

export async function getMyTeacherProfileHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId || !userId) {
    throw new HttpError(400, 'Tenant context is required');
  }
  const teacher = await findTeacherProfileByUserId(tenantId, userId);
  if (!teacher) {
    throw new HttpError(404, 'Teacher profile not found');
  }
  res.status(200).json({ teacher });
}
