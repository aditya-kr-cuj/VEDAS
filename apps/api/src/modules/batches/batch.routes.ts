import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import {
  assignStudentHandler,
  createBatchHandler,
  deleteBatchHandler,
  listBatchesHandler,
  updateBatchHandler
} from './batch.controller.js';
import { assignStudentSchema, createBatchSchema, updateBatchSchema } from './batch.schema.js';

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
