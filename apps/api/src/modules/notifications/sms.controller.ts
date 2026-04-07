import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import { smsQueue } from './sms.queue.js';
import {
  createSmsLog,
  listSmsLogs,
  getTenantCredits,
  addCredits,
  initTenantCredits
} from './sms.repository.js';
import { getUserPreferences } from './email.repository.js';

// ── POST /sms/send ──────────────────────────────────────────────
export async function enqueueSmsHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const phoneNumbers: string[] = req.body.phone_numbers;
  const message: string = req.body.message;
  const userId: string | undefined = req.body.user_id;

  if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
    throw new HttpError(400, 'phone_numbers must be a non-empty array');
  }
  if (!message || message.length < 3) {
    throw new HttpError(400, 'message must be at least 3 characters');
  }
  if (phoneNumbers.length > 100) {
    throw new HttpError(400, 'Maximum 100 phone numbers per request');
  }

  // Check user SMS preference if user_id provided
  if (userId) {
    const prefs = await getUserPreferences({ userId });
    // Check if user disabled SMS for all types (general check)
    const allSmsDisabled = prefs.length > 0 && prefs.every((p: any) => p.sms_enabled === false);
    if (allSmsDisabled) {
      res.status(200).json({ message: 'SMS disabled by user preference' });
      return;
    }
  }

  // Check credit balance
  const credits = await getTenantCredits(tenantId);
  const available = credits ? credits.total_credits - credits.used_credits : 0;
  if (available < phoneNumbers.length) {
    throw new HttpError(402, `Insufficient SMS credits. Need ${phoneNumbers.length}, have ${available}`);
  }

  const logIds: string[] = [];

  for (const phone of phoneNumbers) {
    const log = await createSmsLog({
      tenantId,
      recipientPhone: phone,
      message,
      status: 'queued',
      creditsUsed: 1
    });

    await smsQueue.add(
      {
        logId: log.id,
        tenantId,
        to: phone,
        message
      },
      { attempts: 3, backoff: 3000 }
    );

    logIds.push(log.id);
  }

  res.status(202).json({ message: 'Queued', count: logIds.length, ids: logIds });
}

// ── GET /sms/logs ───────────────────────────────────────────────
export async function listSmsLogsHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const status = req.query.status?.toString();
  const from = req.query.from?.toString();
  const to = req.query.to?.toString();
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const offset = (page - 1) * limit;

  const { rows, total } = await listSmsLogs({ tenantId, status, from, to, limit, offset });

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

// ── GET /sms/credits ────────────────────────────────────────────
export async function getSmsCreditsHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  let credits = await getTenantCredits(tenantId);
  if (!credits) {
    await initTenantCredits(tenantId, 0);
    credits = await getTenantCredits(tenantId);
  }

  const available = (credits?.total_credits ?? 0) - (credits?.used_credits ?? 0);
  const isLow = available <= (credits?.low_credit_threshold ?? 50);

  res.status(200).json({
    credits: {
      total: credits?.total_credits ?? 0,
      used: credits?.used_credits ?? 0,
      available,
      lowThreshold: credits?.low_credit_threshold ?? 50,
      isLow
    }
  });
}

// ── POST /sms/credits ───────────────────────────────────────────
export async function addSmsCreditsHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const amount = Number(req.body.amount);
  if (!amount || amount <= 0 || !Number.isInteger(amount)) {
    throw new HttpError(400, 'amount must be a positive integer');
  }
  if (amount > 100000) {
    throw new HttpError(400, 'Maximum 100,000 credits per request');
  }

  const updated = await addCredits(tenantId, amount);

  res.status(200).json({
    message: `Added ${amount} SMS credits`,
    credits: {
      total: updated?.total_credits ?? 0,
      used: updated?.used_credits ?? 0,
      available: (updated?.total_credits ?? 0) - (updated?.used_credits ?? 0)
    }
  });
}
