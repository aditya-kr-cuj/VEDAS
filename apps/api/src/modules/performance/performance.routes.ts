import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.js';
import { performanceOverviewHandler, subjectPerformanceHandler } from './performance.controller.js';

export const performanceRouter = Router();

performanceRouter.get(
  '/student/:id/performance/overview',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher', 'student']),
  asyncHandler(performanceOverviewHandler)
);

performanceRouter.get(
  '/student/:id/performance/subject/:courseId',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher', 'student']),
  asyncHandler(subjectPerformanceHandler)
);
