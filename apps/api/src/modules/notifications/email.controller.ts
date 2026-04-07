import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import { emailQueue } from './email.queue.js';
import { createEmailLog, getUserPreferences, listEmailLogs, upsertUserPreference } from './email.repository.js';
import { buildEmailTemplate } from '../../utils/email-templates.js';

export async function enqueueEmailHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const authUserId = req.auth?.userId;
  if (!tenantId || !authUserId) throw new HttpError(400, 'Tenant context is required');

  const templateName = req.body.template_name;
  const to = req.body.to;
  const sendAt = req.body.send_at;
  const data = req.body.data ?? {};
  const recipientUserId = req.body.user_id;

  if (!templateName || !to) throw new HttpError(400, 'template_name and to are required');

  if (recipientUserId) {
    const prefs = await getUserPreferences({ userId: recipientUserId });
    const pref = prefs.find((p: any) => p.notification_type === templateName);
    if (pref && pref.email_enabled === false) {
      res.status(200).json({ message: 'Email disabled by user preference' });
      return;
    }
  }

  const template = buildEmailTemplate(templateName, data);
  const log = await createEmailLog({
    tenantId,
    recipientEmail: to,
    subject: template.subject,
    templateName,
    status: 'queued'
  });

  const delay = sendAt ? Math.max(new Date(sendAt).getTime() - Date.now(), 0) : 0;
  await emailQueue.add(
    {
      logId: log.id,
      to,
      templateName,
      data
    },
    { attempts: 3, backoff: 3000, delay }
  );

  res.status(202).json({ message: 'Queued', id: log.id });
}

export async function listEmailLogsHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const status = req.query.status?.toString();
  const from = req.query.from?.toString();
  const to = req.query.to?.toString();
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const offset = (page - 1) * limit;

  const { rows, total } = await listEmailLogs({ tenantId, status, from, to, limit, offset });

  res.status(200).json({
    logs: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}

export async function listPreferencesHandler(req: Request, res: Response): Promise<void> {
  const userId = req.auth?.userId;
  if (!userId) throw new HttpError(401, 'Unauthorized');
  const prefs = await getUserPreferences({ userId });
  res.status(200).json({ preferences: prefs });
}

export async function updatePreferencesHandler(req: Request, res: Response): Promise<void> {
  const userId = req.auth?.userId;
  if (!userId) throw new HttpError(401, 'Unauthorized');
  const prefs = req.body.preferences ?? [];
  if (!Array.isArray(prefs)) throw new HttpError(400, 'preferences must be an array');
  for (const pref of prefs) {
    await upsertUserPreference({
      userId,
      notificationType: pref.notification_type,
      emailEnabled: Boolean(pref.email_enabled),
      smsEnabled: Boolean(pref.sms_enabled)
    });
  }
  res.status(200).json({ message: 'Preferences updated' });
}
