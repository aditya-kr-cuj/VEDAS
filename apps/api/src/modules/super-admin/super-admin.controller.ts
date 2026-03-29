import type { Request, Response } from 'express';
import { listTenantSummaries } from './super-admin.repository.js';

export async function listTenantsHandler(_req: Request, res: Response): Promise<void> {
  const tenants = await listTenantSummaries();
  res.status(200).json({ tenants });
}
