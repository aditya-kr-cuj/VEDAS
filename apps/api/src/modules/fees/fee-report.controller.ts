import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import {
  dailyCollectionReport,
  listDueFees,
  listOverdueFees,
  monthlyCollectionReport,
  studentFeeStatement,
  summaryReport,
  listStudentFeesByUser
} from './fee-report.repository.js';

function getRange(req: Request) {
  const from = req.query.from?.toString();
  const to = req.query.to?.toString();
  if (!from || !to) {
    throw new HttpError(400, 'from and to dates are required');
  }
  return { from, to };
}

export async function listDueFeesHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');
  const rows = await listDueFees(tenantId);
  res.status(200).json({ dues: rows });
}

export async function listOverdueFeesHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');
  const rows = await listOverdueFees(tenantId);
  res.status(200).json({ overdue: rows });
}

export async function summaryReportHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');
  const { from, to } = getRange(req);
  const summary = await summaryReport(tenantId, from, to);
  res.status(200).json({ summary });
}

export async function dailyReportHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');
  const { from, to } = getRange(req);
  const rows = await dailyCollectionReport(tenantId, from, to);
  res.status(200).json({ daily: rows });
}

export async function monthlyReportHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');
  const { from, to } = getRange(req);
  const rows = await monthlyCollectionReport(tenantId, from, to);
  res.status(200).json({ monthly: rows });
}

export async function studentStatementHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');
  const result = await studentFeeStatement(tenantId, req.params.studentId);
  res.status(200).json(result);
}

export async function myFeesHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId || !userId) throw new HttpError(400, 'Tenant context is required');
  const rows = await listStudentFeesByUser(tenantId, userId);
  res.status(200).json({ fees: rows });
}
