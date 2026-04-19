import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import {
  createOtherIncome, listOtherIncome, getOtherIncomeById,
  updateOtherIncome, deleteOtherIncome,
  getProfitLoss, getBalanceSheet, getGstReport, getTallyExport
} from './finance.repository.js';
import { getMonthlyReport, getYearlyReport } from '../budget/budget.repository.js';
import { getTaxSettings, upsertTaxSettings } from './tax.repository.js';

// ── Other Income CRUD ─────────────────────────────────────────────────────────

export async function createOtherIncomeHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const userId   = req.auth?.userId;
  if (!tenantId || !userId) throw new HttpError(400, 'Tenant context required');

  const income = await createOtherIncome({
    tenantId,
    sourceName:  req.body.sourceName,
    amount:      req.body.amount,
    incomeDate:  req.body.incomeDate,
    description: req.body.description,
    recordedBy:  userId
  });
  res.status(201).json({ income });
}

export async function listOtherIncomeHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context required');

  const page  = Math.max(Number(req.query.page  ?? 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit ?? 20), 1), 100);

  const { rows, total } = await listOtherIncome({
    tenantId,
    from:  req.query.from?.toString(),
    to:    req.query.to?.toString(),
    page, limit
  });
  res.json({ income: rows, page, limit, total });
}

export async function getOtherIncomeHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context required');

  const income = await getOtherIncomeById(tenantId, req.params.id);
  if (!income) throw new HttpError(404, 'Income record not found');
  res.json({ income });
}

export async function updateOtherIncomeHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context required');

  const existing = await getOtherIncomeById(tenantId, req.params.id);
  if (!existing) throw new HttpError(404, 'Income record not found');

  const income = await updateOtherIncome({
    tenantId,
    id:          req.params.id,
    sourceName:  req.body.sourceName,
    amount:      req.body.amount,
    incomeDate:  req.body.incomeDate,
    description: req.body.description
  });
  res.json({ income });
}

export async function deleteOtherIncomeHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context required');

  const existing = await getOtherIncomeById(tenantId, req.params.id);
  if (!existing) throw new HttpError(404, 'Income record not found');

  await deleteOtherIncome(tenantId, req.params.id);
  res.json({ message: 'Income record deleted' });
}

// ── Financial Reports ─────────────────────────────────────────────────────────

export async function profitLossHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context required');

  const now  = new Date();
  const from = req.query.from?.toString() ?? `${now.getFullYear()}-01-01`;
  const to   = req.query.to?.toString()   ?? now.toISOString().slice(0, 10);

  const report = await getProfitLoss({ tenantId, from, to });
  res.json(report);
}

export async function balanceSheetHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context required');

  const asOf = req.query.as_of?.toString() ?? new Date().toISOString().slice(0, 10);
  const sheet = await getBalanceSheet({ tenantId, asOf });
  res.json(sheet);
}

export async function monthlyFinancialReportHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context required');

  const year = Number(req.query.year);
  const month = Number(req.query.month);

  const report = await getMonthlyReport({ tenantId, year, month });
  res.json(report);
}

export async function yearlyFinancialReportHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context required');

  const year = Number(req.query.year);

  const report = await getYearlyReport({ tenantId, year });
  res.json(report);
}

export async function getTaxSettingsHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context required');

  const settings = await getTaxSettings(tenantId);
  res.json({ settings });
}

export async function upsertTaxSettingsHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context required');

  const settings = await upsertTaxSettings({
    tenantId,
    gstNumber: req.body.gstNumber ?? null,
    taxRate: req.body.taxRate,
    taxRegime: req.body.taxRegime,
    financialYearStartMonth: req.body.financialYearStartMonth
  });

  res.json({ settings });
}

export async function gstReportHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context required');

  const from = req.query.from?.toString() ?? '';
  const to = req.query.to?.toString() ?? '';
  const report = await getGstReport({ tenantId, from, to });
  res.json(report);
}

export async function tallyExportHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context required');

  const from = req.query.from?.toString() ?? '';
  const to = req.query.to?.toString() ?? '';
  const format = (req.query.format?.toString() ?? 'xml') as 'xml' | 'excel';

  const exported = await getTallyExport({ tenantId, from, to, format });
  res.setHeader('Content-Type', exported.contentType);
  res.setHeader('Content-Disposition', `attachment; filename=${exported.filename}`);
  res.status(200).send(exported.body);
}
