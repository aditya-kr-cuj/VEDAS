import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import {
  createAvailability,
  deleteAvailability,
  findAvailabilityById,
  listAvailabilityByTeacher,
  updateAvailability
} from './availability.repository.js';

function assertCanManage(req: Request, teacherUserId: string) {
  if (req.role === 'institute_admin') return;
  if (req.role === 'teacher' && req.auth?.userId === teacherUserId) return;
  throw new HttpError(403, 'Not allowed to manage this availability');
}

export async function listAvailabilityHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  assertCanManage(req, req.params.id);

  const records = await listAvailabilityByTeacher({
    tenantId,
    teacherUserId: req.params.id
  });
  res.status(200).json({ availability: records });
}

export async function createAvailabilityHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  assertCanManage(req, req.params.id);

  const record = await createAvailability({
    tenantId,
    teacherUserId: req.params.id,
    dayOfWeek: req.body.dayOfWeek,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    isAvailable: req.body.isAvailable,
    reason: req.body.reason
  });

  res.status(201).json({ availability: record });
}

export async function updateAvailabilityHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  assertCanManage(req, req.params.id);

  const existing = await findAvailabilityById({
    tenantId,
    teacherUserId: req.params.id,
    availabilityId: req.params.availabilityId
  });
  if (!existing) {
    throw new HttpError(404, 'Availability not found');
  }

  await updateAvailability({
    tenantId,
    teacherUserId: req.params.id,
    availabilityId: req.params.availabilityId,
    dayOfWeek: req.body.dayOfWeek,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    isAvailable: req.body.isAvailable,
    reason: req.body.reason
  });

  res.status(200).json({ message: 'Availability updated' });
}

export async function deleteAvailabilityHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  assertCanManage(req, req.params.id);

  const existing = await findAvailabilityById({
    tenantId,
    teacherUserId: req.params.id,
    availabilityId: req.params.availabilityId
  });
  if (!existing) {
    throw new HttpError(404, 'Availability not found');
  }

  await deleteAvailability({
    tenantId,
    teacherUserId: req.params.id,
    availabilityId: req.params.availabilityId
  });

  res.status(200).json({ message: 'Availability removed' });
}
