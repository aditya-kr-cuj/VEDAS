import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import { createEventSchema, updateEventSchema, eventIdParamSchema } from './calendar.schema.js';
import { createEventHandler, listEventsHandler, updateEventHandler, deleteEventHandler } from './calendar.controller.js';

export const calendarRouter = Router();

calendarRouter.post(
  '/events',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  validateBody(createEventSchema),
  asyncHandler(createEventHandler)
);

calendarRouter.get(
  '/events',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher', 'student']),
  asyncHandler(listEventsHandler)
);

calendarRouter.put(
  '/events/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  validateParams(eventIdParamSchema),
  validateBody(updateEventSchema),
  asyncHandler(updateEventHandler)
);

calendarRouter.delete(
  '/events/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateParams(eventIdParamSchema),
  asyncHandler(deleteEventHandler)
);
