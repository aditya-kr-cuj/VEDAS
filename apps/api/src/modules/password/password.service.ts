import { addMinutes } from '../../utils/date.js';
import { generateSecureToken, hashPassword, sha256 } from '../../utils/crypto.js';
import { findUserByEmail, updateUserPassword } from '../users/user.repository.js';
import { createPasswordResetToken, findValidPasswordResetToken, markPasswordResetUsed } from './password.repository.js';
import { HttpError } from '../../utils/http-error.js';
import { createNotification, markNotificationSent } from '../notifications/notification.repository.js';
import { sendEmail } from '../../utils/email.js';

export async function requestPasswordReset(email: string) {
  const user = await findUserByEmail(email);
  if (!user) {
    return { requested: true };
  }

  const rawToken = generateSecureToken(32);
  const tokenHash = sha256(rawToken);
  const expiresAt = addMinutes(new Date(), 30);

  await createPasswordResetToken({ userId: user.id, tokenHash, expiresAt });

  const notification = await createNotification({
    tenantId: user.tenant_id,
    recipientUserId: user.id,
    subject: 'Reset your VEDAS password',
    body: `Your reset token is: ${rawToken}`
  });

  await sendEmail({ to: user.email, subject: notification.subject, body: notification.body });
  await markNotificationSent(notification.id);

  return { requested: true, resetToken: rawToken };
}

export async function confirmPasswordReset(payload: { token: string; newPassword: string }) {
  const tokenHash = sha256(payload.token);
  const record = await findValidPasswordResetToken(tokenHash);

  if (!record) {
    throw new HttpError(400, 'Invalid or expired reset token');
  }

  const passwordHash = await hashPassword(payload.newPassword);
  await updateUserPassword({ userId: record.user_id, passwordHash });
  await markPasswordResetUsed(tokenHash);

  return { reset: true };
}
