import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import {
  createExpenseCategory, listExpenseCategories, findExpenseCategoryById,
  updateExpenseCategory, deleteExpenseCategory,
  createExpense, listExpenses, getExpenseById, updateExpense, deleteExpense,
  getExpenseSummary
} from './expense.repository.js';

// ── Expense Categories ────────────────────────────────────────────────────────

export async function createExpenseCategoryHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context required');

  const category = await createExpenseCategory({
    tenantId,
    categoryName:     req.body.categoryName,
    categoryType:     req.body.categoryType ?? 'variable',
    parentCategoryId: req.body.parentCategoryId ?? null
  });
  res.status(201).json({ category });
}

export async function listExpenseCategoriesHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context required');
  const categories = await listExpenseCategories(tenantId);
  res.json({ categories });
}

export async function updateExpenseCategoryHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context required');

  const existing = await findExpenseCategoryById(tenantId, req.params.id);
  if (!existing) throw new HttpError(404, 'Category not found');

  const category = await updateExpenseCategory({
    tenantId,
    categoryId:       req.params.id,
    categoryName:     req.body.categoryName,
    categoryType:     req.body.categoryType,
    parentCategoryId: req.body.parentCategoryId
  });
  res.json({ category });
}

export async function deleteExpenseCategoryHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context required');

  try {
    await deleteExpenseCategory(tenantId, req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    throw new HttpError(409, err instanceof Error ? err.message : 'Cannot delete category');
  }
}

// ── Expenses ──────────────────────────────────────────────────────────────────

export async function createExpenseHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const userId   = req.auth?.userId;
  if (!tenantId || !userId) throw new HttpError(400, 'Tenant context required');

  const expense = await createExpense({
    tenantId,
    expenseCategoryId:   req.body.expenseCategoryId,
    amount:              req.body.amount,
    expenseDate:         req.body.expenseDate,
    description:         req.body.description,
    paymentMode:         req.body.paymentMode ?? 'cash',
    vendorName:          req.body.vendorName,
    receiptUrl:          req.body.receiptUrl,
    recordedBy:          userId,
    isRecurring:         req.body.isRecurring ?? false,
    recurrenceFrequency: req.body.recurrenceFrequency ?? null
  });
  res.status(201).json({ expense });
}

export async function listExpensesHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context required');

  const page  = Math.max(Number(req.query.page  ?? 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit ?? 20), 1), 100);

  const isRecurring = req.query.is_recurring !== undefined
    ? req.query.is_recurring === 'true'
    : undefined;

  const { rows, total, summary } = await listExpenses({
    tenantId,
    categoryId:  req.query.category_id?.toString(),
    paymentMode: req.query.payment_mode?.toString(),
    from:        req.query.from?.toString(),
    to:          req.query.to?.toString(),
    isRecurring,
    page,
    limit
  });

  res.json({ expenses: rows, page, limit, total, summary });
}

export async function getExpenseHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context required');

  const expense = await getExpenseById(tenantId, req.params.id);
  if (!expense) throw new HttpError(404, 'Expense not found');
  res.json({ expense });
}

export async function updateExpenseHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context required');

  const expense = await getExpenseById(tenantId, req.params.id);
  if (!expense) throw new HttpError(404, 'Expense not found');

  const updated = await updateExpense({ tenantId, expenseId: req.params.id, ...req.body });
  res.json({ expense: updated });
}

export async function deleteExpenseHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context required');

  const expense = await getExpenseById(tenantId, req.params.id);
  if (!expense) throw new HttpError(404, 'Expense not found');

  await deleteExpense(tenantId, req.params.id);
  res.json({ message: 'Expense deleted' });
}

export async function expenseSummaryHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context required');
  const summary = await getExpenseSummary(tenantId);
  res.json({ summary });
}
