import type { Request, Response } from 'express';
import { listActivePlans } from './plan.repository.js';

export async function listPlansHandler(_req: Request, res: Response): Promise<void> {
  const plans = await listActivePlans();
  res.status(200).json({ plans });
}
