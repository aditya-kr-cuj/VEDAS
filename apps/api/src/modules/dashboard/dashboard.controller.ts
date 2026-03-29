import type { Request, Response } from 'express';
import { getDashboardSummary } from './dashboard.repository.js';
import { HttpError } from '../../utils/http-error.js';

export async function getDashboardSummaryHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  const summary = await getDashboardSummary(tenantId);
  res.status(200).json({ summary });
}
