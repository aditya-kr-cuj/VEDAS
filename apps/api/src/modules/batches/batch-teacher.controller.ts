import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import {
  assignTeacherToBatchService,
  listBatchesForTeacherService,
  listTeachersForBatchService,
  removeTeacherFromBatchService
} from './batch-teacher.service.js';

export async function assignTeacherToBatchHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  const record = await assignTeacherToBatchService({
    tenantId,
    batchId: req.params.id,
    teacherUserId: req.body.teacherUserId,
    courseId: req.body.courseId
  });

  res.status(201).json({ assignment: record });
}

export async function removeTeacherFromBatchHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  await removeTeacherFromBatchService({
    tenantId,
    batchId: req.params.batchId,
    teacherUserId: req.params.teacherId
  });

  res.status(200).json({ message: 'Teacher removed from batch' });
}

export async function listTeachersForBatchHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  const teachers = await listTeachersForBatchService({ tenantId, batchId: req.params.id });
  res.status(200).json({ teachers });
}

export async function listBatchesForTeacherHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  const batches = await listBatchesForTeacherService({ tenantId, teacherUserId: req.params.id });
  res.status(200).json({ batches });
}
