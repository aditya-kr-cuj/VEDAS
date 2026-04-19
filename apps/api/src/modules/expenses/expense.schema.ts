import { z } from 'zod';

// ── Expense Category ──────────────────────────────────────────────────────────

export const createExpenseCategorySchema = z.object({
  categoryName:      z.string().min(1).max(120),
  categoryType:      z.enum(['fixed', 'variable']).default('variable'),
  parentCategoryId:  z.string().uuid().nullable().optional()
});

export const updateExpenseCategorySchema = z.object({
  categoryName:      z.string().min(1).max(120).optional(),
  categoryType:      z.enum(['fixed', 'variable']).optional(),
  parentCategoryId:  z.string().uuid().nullable().optional()
});

export const categoryIdParamSchema = z.object({ id: z.string().uuid() });

// ── Expense ───────────────────────────────────────────────────────────────────

export const createExpenseSchema = z.object({
  expenseCategoryId:     z.string().uuid(),
  amount:                z.number().positive(),
  expenseDate:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  description:           z.string().max(2000).optional(),
  paymentMode:           z.enum(['cash', 'bank_transfer', 'cheque', 'card']).default('cash'),
  vendorName:            z.string().max(200).optional(),
  receiptUrl:            z.string().url().optional(),
  isRecurring:           z.boolean().default(false),
  recurrenceFrequency:   z.enum(['monthly', 'quarterly', 'yearly']).nullable().optional()
}).refine(
  (data) => !data.isRecurring || data.recurrenceFrequency != null,
  { message: 'recurrenceFrequency is required when isRecurring is true', path: ['recurrenceFrequency'] }
);

export const updateExpenseSchema = z.object({
  expenseCategoryId:    z.string().uuid().optional(),
  amount:               z.number().positive().optional(),
  expenseDate:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  description:          z.string().max(2000).optional(),
  paymentMode:          z.enum(['cash', 'bank_transfer', 'cheque', 'card']).optional(),
  vendorName:           z.string().max(200).optional(),
  receiptUrl:           z.string().url().optional(),
  isRecurring:          z.boolean().optional(),
  recurrenceFrequency:  z.enum(['monthly', 'quarterly', 'yearly']).nullable().optional()
});

export const expenseIdParamSchema = z.object({ id: z.string().uuid() });
