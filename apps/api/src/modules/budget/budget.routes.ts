import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { upsertBudgetsSchema } from './budget.schema.js';
import {
  upsertBudgetsHandler,
  getBudgetHandler,
  listBudgetYearsHandler,
  deleteBudgetHandler
} from './budget.controller.js';

export const budgetRouter = Router();

// ── Budget CRUD ───────────────────────────────────────────────────────────────

// POST /api/v1/budgets  – upsert (set) budgets for a year
budgetRouter.post(
  '/',
  authenticate, requireTenant,
  authorize(['institute_admin']),
  validateBody(upsertBudgetsSchema),
  asyncHandler(upsertBudgetsHandler)
);

// GET /api/v1/budgets/years  – list years that have budget data (must come before :year)
budgetRouter.get(
  '/years',
  authenticate, requireTenant,
  authorize(['institute_admin', 'staff']),
  asyncHandler(listBudgetYearsHandler)
);

// GET /api/v1/budgets/:year  – get budget vs actual
budgetRouter.get(
  '/:year',
  authenticate, requireTenant,
  authorize(['institute_admin', 'staff']),
  asyncHandler(getBudgetHandler)
);

// DELETE /api/v1/budgets/:id
budgetRouter.delete(
  '/:id',
  authenticate, requireTenant,
  authorize(['institute_admin']),
  asyncHandler(deleteBudgetHandler)
);
