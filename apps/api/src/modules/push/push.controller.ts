import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import { sendPushNotification } from '../../utils/push.js';
import { registerToken, unregisterToken, getTokensByTenant } from './push.repository.js';

// ── POST /push/register ─────────────────────────────────────────
export async function registerTokenHandler(req: Request, res: Response): Promise<void> {
  const userId = req.auth?.userId;
  if (!userId) throw new HttpError(401, 'Unauthorized');

  const { token, platform } = req.body;
  if (!token) throw new HttpError(400, 'token is required');

  await registerToken({
    userId,
    token,
    platform: platform ?? 'web'
  });

  res.status(201).json({ message: 'Device token registered' });
}

// ── DELETE /push/unregister ─────────────────────────────────────
export async function unregisterTokenHandler(req: Request, res: Response): Promise<void> {
  const userId = req.auth?.userId;
  if (!userId) throw new HttpError(401, 'Unauthorized');

  const { token } = req.body;
  if (!token) throw new HttpError(400, 'token is required');

  await unregisterToken({ userId, token });

  res.status(200).json({ message: 'Device token removed' });
}

// ── POST /push/send ─────────────────────────────────────────────
export async function sendPushHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const { title, body, data } = req.body;
  if (!title || !body) throw new HttpError(400, 'title and body are required');

  const tokens = await getTokensByTenant(tenantId);
  if (tokens.length === 0) {
    res.status(200).json({ message: 'No devices registered', sent: 0 });
    return;
  }

  const result = await sendPushNotification({ tokens, title, body, data });

  res.status(200).json({
    message: 'Push notification sent',
    devices: tokens.length,
    success: result.success,
    failure: result.failure
  });
}
