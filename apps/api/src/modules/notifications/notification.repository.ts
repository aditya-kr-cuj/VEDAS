import { query } from '../../db/client.js';

export interface NotificationRecord {
  id: string;
  tenant_id: string | null;
  recipient_user_id: string;
  channel: string;
  subject: string;
  body: string;
  status: string;
  sent_at: Date | null;
  created_at: Date;
}

export async function createNotification(payload: {
  tenantId: string | null;
  recipientUserId: string;
  subject: string;
  body: string;
}): Promise<NotificationRecord> {
  const rows = await query<NotificationRecord>(
    `
      INSERT INTO notifications (tenant_id, recipient_user_id, subject, body)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [payload.tenantId, payload.recipientUserId, payload.subject, payload.body]
  );

  return rows[0];
}

export async function markNotificationSent(id: string): Promise<void> {
  await query('UPDATE notifications SET status = $1, sent_at = NOW() WHERE id = $2', ['sent', id]);
}

export async function listNotificationsForUser(userId: string): Promise<NotificationRecord[]> {
  return query<NotificationRecord>(
    `
      SELECT *
      FROM notifications
      WHERE recipient_user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `,
    [userId]
  );
}
