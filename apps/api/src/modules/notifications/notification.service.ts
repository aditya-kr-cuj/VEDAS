import { createNotification, markNotificationSent } from './notification.repository.js';
import { sendEmail } from '../../utils/email.js';
import { findUserById } from '../users/user.repository.js';
import { HttpError } from '../../utils/http-error.js';

export async function sendEmailNotification(payload: {
  tenantId: string | null;
  recipientUserId: string;
  subject: string;
  body: string;
}) {
  const user = await findUserById(payload.recipientUserId);
  if (!user) {
    throw new HttpError(404, 'Recipient user not found');
  }

  const notification = await createNotification({
    tenantId: payload.tenantId,
    recipientUserId: payload.recipientUserId,
    subject: payload.subject,
    body: payload.body
  });

  await sendEmail({ to: user.email, subject: payload.subject, body: payload.body });
  await markNotificationSent(notification.id);

  return notification;
}
