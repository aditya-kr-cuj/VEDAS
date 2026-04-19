import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import {
  createExpenseCategorySchema,
  updateExpenseCategorySchema,
  categoryIdParamSchema,
  createExpenseSchema,
  updateExpenseSchema,
  expenseIdParamSchema
} from './expense.schema.js';
import {
  createExpenseCategoryHandler,
  listExpenseCategoriesHandler,
  updateExpenseCategoryHandler,
  deleteExpenseCategoryHandler,
  createExpenseHandler,
  listExpensesHandler,
  getExpenseHandler,
  updateExpenseHandler,
  deleteExpenseHandler,
  expenseSummaryHandler
} from './expense.controller.js';

export const expenseRouter = Router();

// ── Expense Categories ────────────────────────────────────────────────────────

// POST /api/v1/expenses/categories
expenseRouter.post(
  '/categories',
  authenticate, requireTenant,
  authorize(['institute_admin', 'staff']),
  validateBody(createExpenseCategorySchema),
  asyncHandler(createExpenseCategoryHandler)
);

// GET /api/v1/expenses/categories
expenseRouter.get(
  '/categories',
  authenticate, requireTenant,
  authorize(['institute_admin', 'staff']),
  asyncHandler(listExpenseCategoriesHandler)
);

// PUT /api/v1/expenses/categories/:id
expenseRouter.put(
  '/categories/:id',
  authenticate, requireTenant,
  authorize(['institute_admin']),
  validateParams(categoryIdParamSchema),
  validateBody(updateExpenseCategorySchema),
  asyncHandler(updateExpenseCategoryHandler)
);

// DELETE /api/v1/expenses/categories/:id
expenseRouter.delete(
  '/categories/:id',
  authenticate, requireTenant,
  authorize(['institute_admin']),
  validateParams(categoryIdParamSchema),
  asyncHandler(deleteExpenseCategoryHandler)
);

// ── Expense Summary ───────────────────────────────────────────────────────────

// GET /api/v1/expenses/summary
expenseRouter.get(
  '/summary',
  authenticate, requireTenant,
  authorize(['institute_admin', 'staff']),
  asyncHandler(expenseSummaryHandler)
);

// ── Expenses ──────────────────────────────────────────────────────────────────

// POST /api/v1/expenses
expenseRouter.post(
  '/',
  authenticate, requireTenant,
  authorize(['institute_admin', 'staff']),
  validateBody(createExpenseSchema),
  asyncHandler(createExpenseHandler)
);

// GET /api/v1/expenses
expenseRouter.get(
  '/',
  authenticate, requireTenant,
  authorize(['institute_admin', 'staff']),
  asyncHandler(listExpensesHandler)
);

// GET /api/v1/expenses/:id
expenseRouter.get(
  '/:id',
  authenticate, requireTenant,
  authorize(['institute_admin', 'staff']),
  validateParams(expenseIdParamSchema),
  asyncHandler(getExpenseHandler)
);

// PUT /api/v1/expenses/:id
expenseRouter.put(
  '/:id',
  authenticate, requireTenant,
  authorize(['institute_admin', 'staff']),
  validateParams(expenseIdParamSchema),
  validateBody(updateExpenseSchema),
  asyncHandler(updateExpenseHandler)
);

// DELETE /api/v1/expenses/:id
expenseRouter.delete(
  '/:id',
  authenticate, requireTenant,
  authorize(['institute_admin']),
  validateParams(expenseIdParamSchema),
  asyncHandler(deleteExpenseHandler)
);
