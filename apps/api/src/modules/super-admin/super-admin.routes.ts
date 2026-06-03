import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  getDashboardHandler,
  listInstitutesHandler,
  getInstituteDetailHandler,
  updateInstituteHandler,
  updateInstituteStatusHandler,
  deleteInstituteHandler,
  getSignupAnalyticsHandler,
  getRevenueAnalyticsHandler,
  listTenantsHandler
} from './super-admin.controller.js';

export const superAdminRouter = Router();

const guard = [authenticate, authorize(['super_admin'])];

// Legacy
superAdminRouter.get('/tenants', ...guard, asyncHandler(listTenantsHandler));

// Dashboard
superAdminRouter.get('/dashboard/stats', ...guard, asyncHandler(getDashboardHandler));

// Institute Management
superAdminRouter.get('/institutes', ...guard, asyncHandler(listInstitutesHandler));
superAdminRouter.get('/institutes/:id', ...guard, asyncHandler(getInstituteDetailHandler));
superAdminRouter.put('/institutes/:id', ...guard, asyncHandler(updateInstituteHandler));
superAdminRouter.put('/institutes/:id/status', ...guard, asyncHandler(updateInstituteStatusHandler));
superAdminRouter.delete('/institutes/:id', ...guard, asyncHandler(deleteInstituteHandler));

// Analytics
superAdminRouter.get('/analytics/signups', ...guard, asyncHandler(getSignupAnalyticsHandler));
superAdminRouter.get('/analytics/revenue', ...guard, asyncHandler(getRevenueAnalyticsHandler));
