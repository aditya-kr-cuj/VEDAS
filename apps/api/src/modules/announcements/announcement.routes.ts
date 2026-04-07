import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import {
  createAnnouncementHandler,
  deleteAnnouncementHandler,
  listAnnouncementsHandler,
  markReadHandler
} from './announcement.controller.js';
import { announcementIdParamSchema, createAnnouncementSchema } from './announcement.schema.js';

export const announcementRouter = Router();

announcementRouter.post(
  '/',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  validateBody(createAnnouncementSchema),
  asyncHandler(createAnnouncementHandler)
);

announcementRouter.get(
  '/',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher', 'student']),
  asyncHandler(listAnnouncementsHandler)
);

announcementRouter.patch(
  '/:id/read',
  authenticate,
  requireTenant,
  authorize(['teacher', 'student']),
  validateParams(announcementIdParamSchema),
  asyncHandler(markReadHandler)
);

announcementRouter.delete(
  '/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateParams(announcementIdParamSchema),
  asyncHandler(deleteAnnouncementHandler)
);
