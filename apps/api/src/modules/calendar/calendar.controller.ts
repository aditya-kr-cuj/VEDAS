import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import { createEvent, listEvents, getEventById, updateEvent, deleteEvent } from './calendar.repository.js';

// ── POST /calendar/events ───────────────────────────────────────
export async function createEventHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');
  if (!userId) throw new HttpError(401, 'Unauthorized');

  const event = await createEvent({
    tenantId,
    title: req.body.title,
    description: req.body.description,
    eventType: req.body.event_type ?? 'event',
    startDate: req.body.start_date,
    endDate: req.body.end_date,
    location: req.body.location,
    createdBy: userId,
    targetType: req.body.target_type ?? 'all',
    targetId: req.body.target_id
  });

  res.status(201).json({ event });
}

// ── GET /calendar/events ────────────────────────────────────────
export async function listEventsHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const from = req.query.from?.toString();
  const to = req.query.to?.toString();
  const eventType = req.query.event_type?.toString();

  const events = await listEvents({ tenantId, from, to, eventType });

  res.status(200).json({ events });
}

// ── PUT /calendar/events/:id ────────────────────────────────────
export async function updateEventHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const eventId = req.params.id;

  const updated = await updateEvent({
    eventId,
    tenantId,
    title: req.body.title,
    description: req.body.description,
    eventType: req.body.event_type,
    startDate: req.body.start_date,
    endDate: req.body.end_date,
    location: req.body.location,
    targetType: req.body.target_type,
    targetId: req.body.target_id
  });

  if (!updated) throw new HttpError(404, 'Event not found');

  res.status(200).json({ event: updated });
}

// ── DELETE /calendar/events/:id ─────────────────────────────────
export async function deleteEventHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const deleted = await deleteEvent(req.params.id, tenantId);
  if (!deleted) throw new HttpError(404, 'Event not found');

  res.status(200).json({ message: 'Event deleted' });
}
