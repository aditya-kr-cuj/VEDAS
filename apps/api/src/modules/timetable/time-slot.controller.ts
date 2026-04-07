import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import {
  createTimeSlot,
  deleteTimeSlot,
  findTimeSlotById,
  listTimeSlots,
  updateTimeSlot
} from './time-slot.repository.js';

export async function createTimeSlotHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  const slot = await createTimeSlot({
    tenantId,
    dayOfWeek: req.body.dayOfWeek,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    slotNumber: req.body.slotNumber
  });

  res.status(201).json({ slot });
}

export async function listTimeSlotsHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  const slots = await listTimeSlots(tenantId);
  res.status(200).json({ slots });
}

export async function getTimeSlotHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  const slot = await findTimeSlotById(tenantId, req.params.id);
  if (!slot) {
    throw new HttpError(404, 'Time slot not found');
  }

  res.status(200).json({ slot });
}

export async function updateTimeSlotHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  await updateTimeSlot({
    tenantId,
    id: req.params.id,
    dayOfWeek: req.body.dayOfWeek,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    slotNumber: req.body.slotNumber
  });

  res.status(200).json({ message: 'Time slot updated' });
}

export async function deleteTimeSlotHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  await deleteTimeSlot({ tenantId, id: req.params.id });
  res.status(200).json({ message: 'Time slot deleted' });
}
