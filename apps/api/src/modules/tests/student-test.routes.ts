import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.js';
import {
  getResultHandler,
  listStudentTestsHandler,
  saveAnswerHandler,
  startTestHandler,
  submitTestHandler
} from './student-test.controller.js';
import { studentPerformanceHandler } from './analytics.controller.js';

export const studentTestRouter = Router();

studentTestRouter.get(
  '/student/tests',
  authenticate,
  requireTenant,
  authorize(['student']),
  asyncHandler(listStudentTestsHandler)
);

studentTestRouter.get(
  '/student/performance/tests',
  authenticate,
  requireTenant,
  authorize(['student']),
  asyncHandler(studentPerformanceHandler)
);

studentTestRouter.post(
  '/tests/:id/start',
  authenticate,
  requireTenant,
  authorize(['student']),
  asyncHandler(startTestHandler)
);

studentTestRouter.post(
  '/tests/:id/save-answer',
  authenticate,
  requireTenant,
  authorize(['student']),
  asyncHandler(saveAnswerHandler)
);

studentTestRouter.post(
  '/tests/:id/submit',
  authenticate,
  requireTenant,
  authorize(['student']),
  asyncHandler(submitTestHandler)
);

studentTestRouter.get(
  '/tests/:id/result',
  authenticate,
  requireTenant,
  authorize(['student']),
  asyncHandler(getResultHandler)
);
