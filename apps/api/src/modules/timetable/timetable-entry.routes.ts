import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import {
  createTimetableEntryHandler,
  deleteTimetableEntryHandler,
  listBatchTimetableHandler,
  listTeacherTimetableHandler,
  updateTimetableEntryHandler
} from './timetable-entry.controller.js';
import {
  createTimetableEntrySchema,
  timetableBatchParamSchema,
  timetableEntryIdParamSchema,
  timetableTeacherParamSchema,
  updateTimetableEntrySchema
} from './timetable-entry.schema.js';
import { applyTimetableSchema, generateTimetableSchema } from './timetable-generate.schema.js';
import { applyTimetableHandler, generateTimetableHandler } from './timetable-generate.controller.js';

export const timetableEntryRouter = Router();

timetableEntryRouter.post(
  '/entries',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateBody(createTimetableEntrySchema),
  asyncHandler(createTimetableEntryHandler)
);

timetableEntryRouter.put(
  '/entries/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateParams(timetableEntryIdParamSchema),
  validateBody(updateTimetableEntrySchema),
  asyncHandler(updateTimetableEntryHandler)
);

timetableEntryRouter.delete(
  '/entries/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateParams(timetableEntryIdParamSchema),
  asyncHandler(deleteTimetableEntryHandler)
);

timetableEntryRouter.get(
  '/batch/:batchId',
  authenticate,
  requireTenant,
  validateParams(timetableBatchParamSchema),
  asyncHandler(listBatchTimetableHandler)
);

timetableEntryRouter.get(
  '/teacher/:teacherId',
  authenticate,
  requireTenant,
  validateParams(timetableTeacherParamSchema),
  asyncHandler(listTeacherTimetableHandler)
);

timetableEntryRouter.post(
  '/generate',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateBody(generateTimetableSchema),
  asyncHandler(generateTimetableHandler)
);

timetableEntryRouter.post(
  '/apply',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateBody(applyTimetableSchema),
  asyncHandler(applyTimetableHandler)
);
