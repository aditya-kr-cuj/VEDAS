import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/auth.js';
import { studentDashboardHandler, teacherDashboardHandler } from './portal.controller.js';

export const portalRouter = Router();

portalRouter.get('/student/dashboard', authenticate, asyncHandler(studentDashboardHandler));
portalRouter.get('/teacher/dashboard', authenticate, asyncHandler(teacherDashboardHandler));
