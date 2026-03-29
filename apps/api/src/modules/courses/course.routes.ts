import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import {
  assignTeacherHandler,
  createCourseHandler,
  deleteCourseHandler,
  getCourseHandler,
  listCoursesHandler,
  updateCourseHandler
} from './course.controller.js';
import { assignTeacherSchema, createCourseSchema, updateCourseSchema } from './course.schema.js';

export const courseRouter = Router();

courseRouter.post(
  '/',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateBody(createCourseSchema),
  asyncHandler(createCourseHandler)
);

courseRouter.get('/', authenticate, requireTenant, asyncHandler(listCoursesHandler));
courseRouter.get('/:id', authenticate, requireTenant, asyncHandler(getCourseHandler));

courseRouter.put(
  '/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateBody(updateCourseSchema),
  asyncHandler(updateCourseHandler)
);

courseRouter.delete(
  '/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  asyncHandler(deleteCourseHandler)
);

courseRouter.post(
  '/:id/assign-teacher',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateBody(assignTeacherSchema),
  asyncHandler(assignTeacherHandler)
);
