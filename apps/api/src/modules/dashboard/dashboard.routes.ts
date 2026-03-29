import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, requireTenant } from '../../middleware/auth.js';
import { getDashboardSummaryHandler } from './dashboard.controller.js';

export const dashboardRouter = Router();

dashboardRouter.get('/summary', authenticate, requireTenant, asyncHandler(getDashboardSummaryHandler));
