import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.js';
import { validateParams } from '../../middleware/validate.js';
import { listTeacherBatchesHandler } from './teacher.controller.js';
import { teacherIdParamSchema } from './teacher.schema.js';

export const teacherRouter = Router();

teacherRouter.get(
  '/:id/batches',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateParams(teacherIdParamSchema),
  asyncHandler(listTeacherBatchesHandler)
);
