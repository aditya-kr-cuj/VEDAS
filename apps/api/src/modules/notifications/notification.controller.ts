import type { Request, Response } from 'express';
import { sendEmailNotification } from './notification.service.js';
import { listNotificationsForUser } from './notification.repository.js';
import { HttpError } from '../../utils/http-error.js';

export async function sendNotificationHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  const notification = await sendEmailNotification({
    tenantId,
    recipientUserId: req.body.recipientUserId,
    subject: req.body.subject,
    body: req.body.body
  });

  res.status(200).json({ notification });
}

export async function listMyNotificationsHandler(req: Request, res: Response): Promise<void> {
  const userId = req.auth?.userId;
  if (!userId) {
    throw new HttpError(401, 'Unauthorized');
  }

  const notifications = await listNotificationsForUser(userId);
  res.status(200).json({ notifications });
}
