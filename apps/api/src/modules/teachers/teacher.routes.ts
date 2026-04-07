import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.js';
import { validateParams } from '../../middleware/validate.js';
import { getMyTeacherProfileHandler, listTeacherBatchesHandler } from './teacher.controller.js';
import { teacherIdParamSchema } from './teacher.schema.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import {
  createAvailabilityHandler,
  deleteAvailabilityHandler,
  listAvailabilityHandler,
  updateAvailabilityHandler
} from './availability.controller.js';
import { availabilityIdParamSchema, createAvailabilitySchema, updateAvailabilitySchema } from './availability.schema.js';

export const teacherRouter = Router();

teacherRouter.get(
  '/me',
  authenticate,
  requireTenant,
  authorize(['teacher']),
  asyncHandler(getMyTeacherProfileHandler)
);

teacherRouter.get(
  '/:id/batches',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateParams(teacherIdParamSchema),
  asyncHandler(listTeacherBatchesHandler)
);

teacherRouter.get(
  '/:id/availability',
  authenticate,
  requireTenant,
  validateParams(teacherIdParamSchema),
  asyncHandler(listAvailabilityHandler)
);

teacherRouter.post(
  '/:id/availability',
  authenticate,
  requireTenant,
  validateParams(teacherIdParamSchema),
  validateBody(createAvailabilitySchema),
  asyncHandler(createAvailabilityHandler)
);

teacherRouter.put(
  '/:id/availability/:availabilityId',
  authenticate,
  requireTenant,
  validateParams(availabilityIdParamSchema),
  validateBody(updateAvailabilitySchema),
  asyncHandler(updateAvailabilityHandler)
);

teacherRouter.delete(
  '/:id/availability/:availabilityId',
  authenticate,
  requireTenant,
  validateParams(availabilityIdParamSchema),
  asyncHandler(deleteAvailabilityHandler)
);
