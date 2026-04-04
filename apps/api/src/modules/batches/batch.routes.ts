import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import {
  assignStudentHandler,
  createBatchHandler,
  deleteBatchHandler,
  listBatchesHandler,
  listBatchStudentsHandler,
  updateBatchHandler
} from './batch.controller.js';
import { assignStudentSchema, createBatchSchema, updateBatchSchema } from './batch.schema.js';
import {
  assignTeacherToBatchHandler,
  listTeachersForBatchHandler,
  removeTeacherFromBatchHandler
} from './batch-teacher.controller.js';
import { assignTeacherToBatchSchema, batchIdParamSchema, batchTeacherParamsSchema } from './batch-teacher.schema.js';
import { validateParams } from '../../middleware/validate.js';

export const batchRouter = Router();

batchRouter.post(
  '/',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateBody(createBatchSchema),
  asyncHandler(createBatchHandler)
);

batchRouter.get('/', authenticate, requireTenant, asyncHandler(listBatchesHandler));

batchRouter.put(
  '/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateBody(updateBatchSchema),
  asyncHandler(updateBatchHandler)
);

batchRouter.delete(
  '/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  asyncHandler(deleteBatchHandler)
);

batchRouter.post(
  '/:id/assign-student',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateBody(assignStudentSchema),
  asyncHandler(assignStudentHandler)
);

batchRouter.get(
  '/:id/students',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateParams(batchIdParamSchema),
  asyncHandler(listBatchStudentsHandler)
);

batchRouter.post(
  '/:id/assign-teacher',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateParams(batchIdParamSchema),
  validateBody(assignTeacherToBatchSchema),
  asyncHandler(assignTeacherToBatchHandler)
);

batchRouter.delete(
  '/:batchId/teachers/:teacherId',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateParams(batchTeacherParamsSchema),
  asyncHandler(removeTeacherFromBatchHandler)
);

batchRouter.get(
  '/:id/teachers',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateParams(batchIdParamSchema),
  asyncHandler(listTeachersForBatchHandler)
);
