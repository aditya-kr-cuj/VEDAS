import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.js';
import { registerTokenHandler, unregisterTokenHandler, sendPushHandler } from './push.controller.js';

export const pushRouter = Router();

pushRouter.post(
  '/register',
  authenticate,
  asyncHandler(registerTokenHandler)
);

pushRouter.delete(
  '/unregister',
  authenticate,
  asyncHandler(unregisterTokenHandler)
);

pushRouter.post(
  '/send',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  asyncHandler(sendPushHandler)
);
