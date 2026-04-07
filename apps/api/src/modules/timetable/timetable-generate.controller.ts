import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import { applyTimetable, generateTimetable } from './timetable-generate.service.js';

export async function generateTimetableHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const result = await generateTimetable({
    tenantId,
    batchId: req.body.batchId,
    courses: req.body.courses
  });

  res.status(200).json(result);
}

export async function applyTimetableHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const result = await applyTimetable({
    tenantId,
    entries: req.body.entries
  });

  res.status(201).json(result);
}
