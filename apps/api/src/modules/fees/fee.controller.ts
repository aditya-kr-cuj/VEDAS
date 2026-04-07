import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import { assignFeeStructure, createFeeStructure, listFeeStructures } from './fee.repository.js';

export async function createFeeStructureHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const structure = await createFeeStructure({
    tenantId,
    name: req.body.name,
    feeType: req.body.feeType,
    amount: req.body.amount,
    frequency: req.body.frequency,
    courseId: req.body.courseId,
    batchId: req.body.batchId,
    lateFeeAmount: req.body.lateFeeAmount,
    lateFeeAfterDays: req.body.lateFeeAfterDays
  });

  res.status(201).json({ structure });
}

export async function listFeeStructuresHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const structures = await listFeeStructures(tenantId);
  res.status(200).json({ structures });
}

export async function assignFeeStructureHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  await assignFeeStructure({
    tenantId,
    feeStructureId: req.body.feeStructureId,
    studentIds: req.body.studentIds,
    dueDate: req.body.dueDate
  });

  res.status(200).json({ message: 'Fees assigned' });
}
