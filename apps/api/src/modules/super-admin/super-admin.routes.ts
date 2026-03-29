import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { listTenantsHandler } from './super-admin.controller.js';

export const superAdminRouter = Router();

superAdminRouter.get('/tenants', authenticate, authorize(['super_admin']), asyncHandler(listTenantsHandler));
