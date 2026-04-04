import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import {
  assignStudentToBatch,
  createBatch,
  deleteBatch,
  listBatches,
  listStudentsForBatch,
  updateBatch
} from './batch.repository.js';

export async function createBatchHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  const batch = await createBatch({
    tenantId,
    courseId: req.body.courseId,
    name: req.body.name,
    schedule: req.body.schedule,
    startDate: req.body.startDate,
    endDate: req.body.endDate
  });

  res.status(201).json({ batch });
}

export async function listBatchesHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  const batches = await listBatches(tenantId);
  res.status(200).json({ batches });
}

export async function updateBatchHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  await updateBatch({
    tenantId,
    batchId: req.params.id,
    name: req.body.name,
    schedule: req.body.schedule,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    isActive: req.body.isActive
  });

  res.status(200).json({ message: 'Batch updated' });
}

export async function deleteBatchHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  await deleteBatch({ tenantId, batchId: req.params.id });
  res.status(200).json({ message: 'Batch deleted' });
}

export async function assignStudentHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  await assignStudentToBatch({
    batchId: req.params.id,
    studentUserId: req.body.studentUserId
  });

  res.status(200).json({ message: 'Student assigned to batch' });
}

export async function listBatchStudentsHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  const students = await listStudentsForBatch({ tenantId, batchId: req.params.id });
  res.status(200).json({ students });
}
