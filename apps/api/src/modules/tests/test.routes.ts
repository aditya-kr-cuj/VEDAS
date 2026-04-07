import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import {
  createTestHandler,
  deleteTestHandler,
  getTestHandler,
  listTestsHandler,
  archiveTestHandler,
  publishTestHandler,
  updateTestHandler
} from './test.controller.js';
import {
  evaluateSubmissionHandler,
  getSubmissionHandler,
  listSubmissionsHandler
} from './grading.controller.js';
import { leaderboardHandler, studentPerformanceHandler, testAnalyticsHandler } from './analytics.controller.js';
import { createTestSchema, testIdParamSchema, updateTestSchema } from './test.schema.js';

export const testRouter = Router();

testRouter.post(
  '/',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  validateBody(createTestSchema),
  asyncHandler(createTestHandler)
);

testRouter.get(
  '/',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  asyncHandler(listTestsHandler)
);

testRouter.get(
  '/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  validateParams(testIdParamSchema),
  asyncHandler(getTestHandler)
);

testRouter.put(
  '/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  validateParams(testIdParamSchema),
  validateBody(updateTestSchema),
  asyncHandler(updateTestHandler)
);

testRouter.delete(
  '/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  validateParams(testIdParamSchema),
  asyncHandler(deleteTestHandler)
);

testRouter.post(
  '/:id/publish',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  validateParams(testIdParamSchema),
  asyncHandler(publishTestHandler)
);

testRouter.patch(
  '/:id/archive',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  validateParams(testIdParamSchema),
  asyncHandler(archiveTestHandler)
);

testRouter.get(
  '/:id/analytics',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  validateParams(testIdParamSchema),
  asyncHandler(testAnalyticsHandler)
);

testRouter.get(
  '/:id/leaderboard',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher', 'student']),
  validateParams(testIdParamSchema),
  asyncHandler(leaderboardHandler)
);

testRouter.get(
  '/:id/submissions',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  validateParams(testIdParamSchema),
  asyncHandler(listSubmissionsHandler)
);

testRouter.get(
  '/:testId/evaluate/:attemptId',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  asyncHandler(getSubmissionHandler)
);

testRouter.post(
  '/:testId/evaluate/:attemptId',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  asyncHandler(evaluateSubmissionHandler)
);
