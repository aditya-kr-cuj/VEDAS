import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { sendNotificationSchema } from './notification.schema.js';
import { listMyNotificationsHandler, sendNotificationHandler } from './notification.controller.js';
import {
  enqueueEmailHandler,
  listEmailLogsHandler,
  listPreferencesHandler,
  updatePreferencesHandler
} from './email.controller.js';

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

notificationRouter.post(
  '/email/send',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  asyncHandler(enqueueEmailHandler)
);

notificationRouter.get(
  '/email/logs',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  asyncHandler(listEmailLogsHandler)
);

notificationRouter.get('/preferences', authenticate, asyncHandler(listPreferencesHandler));
notificationRouter.put('/preferences', authenticate, asyncHandler(updatePreferencesHandler));
