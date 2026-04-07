import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import {
  createTimeSlotHandler,
  deleteTimeSlotHandler,
  getTimeSlotHandler,
  listTimeSlotsHandler,
  updateTimeSlotHandler
} from './time-slot.controller.js';
import { createTimeSlotSchema, timeSlotIdParamSchema, updateTimeSlotSchema } from './time-slot.schema.js';

export const timeSlotRouter = Router();

timeSlotRouter.get('/', authenticate, requireTenant, asyncHandler(listTimeSlotsHandler));

timeSlotRouter.get(
  '/:id',
  authenticate,
  requireTenant,
  validateParams(timeSlotIdParamSchema),
  asyncHandler(getTimeSlotHandler)
);

timeSlotRouter.post(
  '/',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateBody(createTimeSlotSchema),
  asyncHandler(createTimeSlotHandler)
);

timeSlotRouter.put(
  '/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateParams(timeSlotIdParamSchema),
  validateBody(updateTimeSlotSchema),
  asyncHandler(updateTimeSlotHandler)
);

timeSlotRouter.delete(
  '/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateParams(timeSlotIdParamSchema),
  asyncHandler(deleteTimeSlotHandler)
);
