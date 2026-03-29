import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { getMyTenantHandler, updateMyTenantHandler } from './tenant.controller.js';
import { updateTenantProfileSchema } from './tenant.schema.js';

export const tenantRouter = Router();

tenantRouter.get('/me', authenticate, requireTenant, asyncHandler(getMyTenantHandler));
tenantRouter.put(
  '/me',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateBody(updateTenantProfileSchema),
  asyncHandler(updateMyTenantHandler)
);
