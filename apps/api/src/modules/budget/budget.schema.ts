import { z } from 'zod';

// ── Budget upsert ─────────────────────────────────────────────────────────────

export const upsertBudgetsSchema = z.object({
  budget_year: z.number().int().min(2000).max(2100),
  category_budgets: z.array(
    z.object({
      category_id:      z.string().uuid(),
      allocated_amount: z.number().nonnegative()
    })
  ).min(1)
});

// ── Budget update (single row) ────────────────────────────────────────────────

export const updateBudgetSchema = z.object({
  allocated_amount: z.number().nonnegative()
});

// ── Year param ────────────────────────────────────────────────────────────────

export const yearParamSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100)
});

// ── Monthly / yearly report query ─────────────────────────────────────────────

export const monthlyReportQuerySchema = z.object({
  year:  z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12)
});

export const yearlyReportQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100)
});
