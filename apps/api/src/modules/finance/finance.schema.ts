import { z } from 'zod';

// ── Other Income ──────────────────────────────────────────────────────────────

export const createOtherIncomeSchema = z.object({
  sourceName:  z.string().min(1).max(200),
  amount:      z.number().positive(),
  incomeDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().optional(),
});

export const updateOtherIncomeSchema = createOtherIncomeSchema.partial();

export const otherIncomeIdParamSchema = z.object({
  id: z.string().uuid()
});

// ── Financial report query params ─────────────────────────────────────────────

export const dateRangeSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const monthlyFinancialReportQuerySchema = z.object({
  year:  z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12)
});

export const yearlyFinancialReportQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100)
});

export const upsertTaxSettingsSchema = z.object({
  gstNumber: z.string().max(50).optional().nullable(),
  taxRate: z.number().min(0).max(100),
  taxRegime: z.enum(['gst', 'vat', 'none']),
  financialYearStartMonth: z.number().int().min(1).max(12)
});

export const gstReportQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export const tallyExportQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  format: z.enum(['xml', 'excel']).optional().default('xml')
});
