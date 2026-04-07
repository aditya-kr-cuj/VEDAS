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
import {
  enqueueSmsHandler,
  listSmsLogsHandler,
  getSmsCreditsHandler,
  addSmsCreditsHandler
} from './sms.controller.js';
import {
  enqueueWhatsAppHandler,
  listWhatsAppLogsHandler,
  listTemplatesHandler,
  createTemplateHandler,
  listOptinsHandler
} from './whatsapp.controller.js';

export const notificationRouter = Router();

// ── General notifications ───────────────────────────────────────
notificationRouter.post(
  '/send',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  validateBody(sendNotificationSchema),
  asyncHandler(sendNotificationHandler)
);

notificationRouter.get('/my', authenticate, asyncHandler(listMyNotificationsHandler));

// ── Email ───────────────────────────────────────────────────────
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

// ── SMS ─────────────────────────────────────────────────────────
notificationRouter.post(
  '/sms/send',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  asyncHandler(enqueueSmsHandler)
);

notificationRouter.get(
  '/sms/logs',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  asyncHandler(listSmsLogsHandler)
);

notificationRouter.get(
  '/sms/credits',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  asyncHandler(getSmsCreditsHandler)
);

notificationRouter.post(
  '/sms/credits',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  asyncHandler(addSmsCreditsHandler)
);

// ── WhatsApp ────────────────────────────────────────────────────
notificationRouter.post(
  '/whatsapp/send',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  asyncHandler(enqueueWhatsAppHandler)
);

notificationRouter.get(
  '/whatsapp/logs',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  asyncHandler(listWhatsAppLogsHandler)
);

notificationRouter.get(
  '/whatsapp/templates',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  asyncHandler(listTemplatesHandler)
);

notificationRouter.post(
  '/whatsapp/templates',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  asyncHandler(createTemplateHandler)
);

notificationRouter.get(
  '/whatsapp/optins',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  asyncHandler(listOptinsHandler)
);

// ── Preferences ─────────────────────────────────────────────────
notificationRouter.get('/preferences', authenticate, asyncHandler(listPreferencesHandler));
notificationRouter.put('/preferences', authenticate, asyncHandler(updatePreferencesHandler));
