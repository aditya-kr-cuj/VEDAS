import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import {
  upsertBudgets, getBudgetVsActual, getBudgetYears, deleteBudget
} from './budget.repository.js';

// ── Upsert budgets for a year ─────────────────────────────────────────────────

export async function upsertBudgetsHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context required');

  const { budget_year, category_budgets } = req.body as {
    budget_year: number;
    category_budgets: { category_id: string; allocated_amount: number }[];
  };

  const budgets = await upsertBudgets({
    tenantId,
    budgetYear: budget_year,
    categoryBudgets: category_budgets.map((cb) => ({
      categoryId:      cb.category_id,
      allocatedAmount: cb.allocated_amount
    }))
  });

  res.status(201).json({ budgets });
}

// ── Get budget vs actual for a year ──────────────────────────────────────────

export async function getBudgetHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context required');

  const year = Number(req.params.year);
  if (!year || year < 2000 || year > 2100) throw new HttpError(400, 'Invalid year');

  const budgets = await getBudgetVsActual(tenantId, year);
  res.json({ year, budgets });
}

// ── List years with budgets ───────────────────────────────────────────────────

export async function listBudgetYearsHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context required');

  const years = await getBudgetYears(tenantId);
  res.json({ years: years.map((r) => r.year) });
}

// ── Delete a budget row ───────────────────────────────────────────────────────

export async function deleteBudgetHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context required');
  await deleteBudget(tenantId, req.params.id);
  res.json({ message: 'Budget deleted' });
}
