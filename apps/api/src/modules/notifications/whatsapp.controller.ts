import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import { whatsappQueue } from './whatsapp.queue.js';
import {
  createWhatsAppLog,
  listWhatsAppLogs,
  listTemplates,
  createTemplate,
  listOptins,
  isPhoneOptedIn
} from './whatsapp.repository.js';

// ── POST /whatsapp/send ─────────────────────────────────────────
export async function enqueueWhatsAppHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const phoneNumbers: string[] = req.body.phone_numbers;
  const template: string = req.body.template;
  const params: string[] = req.body.params ?? [];
  const language: string = req.body.language ?? 'en';

  if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
    throw new HttpError(400, 'phone_numbers must be a non-empty array');
  }
  if (!template) {
    throw new HttpError(400, 'template is required');
  }
  if (phoneNumbers.length > 100) {
    throw new HttpError(400, 'Maximum 100 phone numbers per request');
  }

  const logIds: string[] = [];
  const skipped: string[] = [];

  for (const phone of phoneNumbers) {
    // Check opt-in status
    const optedIn = await isPhoneOptedIn(tenantId, phone);
    if (!optedIn) {
      skipped.push(phone);
      continue;
    }

    const log = await createWhatsAppLog({
      tenantId,
      recipientPhone: phone,
      templateName: template,
      templateParams: params,
      status: 'queued'
    });

    await whatsappQueue.add(
      {
        logId: log.id,
        to: phone,
        templateName: template,
        templateParams: params,
        language
      },
      { attempts: 3, backoff: 3000 }
    );

    logIds.push(log.id);
  }

  res.status(202).json({
    message: 'Queued',
    queued: logIds.length,
    skipped: skipped.length,
    skippedPhones: skipped.length > 0 ? skipped : undefined,
    ids: logIds
  });
}

// ── GET /whatsapp/logs ──────────────────────────────────────────
export async function listWhatsAppLogsHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const status = req.query.status?.toString();
  const from = req.query.from?.toString();
  const to = req.query.to?.toString();
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const offset = (page - 1) * limit;

  const { rows, total } = await listWhatsAppLogs({ tenantId, status, from, to, limit, offset });

  res.status(200).json({
    logs: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
}

// ── GET /whatsapp/templates ─────────────────────────────────────
export async function listTemplatesHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const templates = await listTemplates(tenantId);
  res.status(200).json({ templates });
}

// ── POST /whatsapp/templates ────────────────────────────────────
export async function createTemplateHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const { name, language, body_text, param_count } = req.body;
  if (!name) throw new HttpError(400, 'name is required');

  const template = await createTemplate({
    tenantId,
    name,
    language: language ?? 'en',
    bodyText: body_text ?? '',
    paramCount: Number(param_count) || 0
  });

  res.status(201).json({ template });
}

// ── GET /whatsapp/optins ────────────────────────────────────────
export async function listOptinsHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const optins = await listOptins(tenantId);
  res.status(200).json({ optins });
}
