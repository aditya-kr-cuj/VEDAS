import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { sendNotificationSchema } from './notification.schema.js';
import { listMyNotificationsHandler, sendNotificationHandler } from './notification.controller.js';

export const notificationRouter = Router();

notificationRouter.post(
  '/send',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  validateBody(sendNotificationSchema),
  asyncHandler(sendNotificationHandler)
);

notificationRouter.get('/my', authenticate, asyncHandler(listMyNotificationsHandler));
