import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import {
  createStaffHandler,
  deleteStaffHandler,
  getStaffHandler,
  listStaffHandler,
  updateStaffHandler
} from './staff.controller.js';
import { createStaffSchema, staffIdParamSchema, updateStaffSchema } from './staff.schema.js';

export const staffRouter = Router();

staffRouter.get('/', authenticate, requireTenant, authorize(['institute_admin']), asyncHandler(listStaffHandler));

staffRouter.get(
  '/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateParams(staffIdParamSchema),
  asyncHandler(getStaffHandler)
);

staffRouter.post(
  '/',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateBody(createStaffSchema),
  asyncHandler(createStaffHandler)
);

staffRouter.put(
  '/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateParams(staffIdParamSchema),
  validateBody(updateStaffSchema),
  asyncHandler(updateStaffHandler)
);

staffRouter.delete(
  '/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateParams(staffIdParamSchema),
  asyncHandler(deleteStaffHandler)
);
