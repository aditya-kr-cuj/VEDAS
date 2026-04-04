import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import { listBatchesForTeacherService } from '../batches/batch-teacher.service.js';

export async function listTeacherBatchesHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  const batches = await listBatchesForTeacherService({ tenantId, teacherUserId: req.params.id });
  res.status(200).json({ batches });
}
