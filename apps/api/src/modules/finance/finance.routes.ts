import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import {
  createOtherIncomeSchema,
  updateOtherIncomeSchema,
  otherIncomeIdParamSchema,
  dateRangeSchema,
  monthlyFinancialReportQuerySchema,
  yearlyFinancialReportQuerySchema,
  upsertTaxSettingsSchema,
  gstReportQuerySchema,
  tallyExportQuerySchema
} from './finance.schema.js';
import {
  createOtherIncomeHandler,
  listOtherIncomeHandler,
  getOtherIncomeHandler,
  updateOtherIncomeHandler,
  deleteOtherIncomeHandler,
  profitLossHandler,
  balanceSheetHandler,
  monthlyFinancialReportHandler,
  yearlyFinancialReportHandler,
  getTaxSettingsHandler,
  upsertTaxSettingsHandler,
  gstReportHandler,
  tallyExportHandler
} from './finance.controller.js';

export const financialRouter = Router();

// ── Other Income ──────────────────────────────────────────────────────────────

// POST /api/v1/financial/income
financialRouter.post(
  '/income',
  authenticate, requireTenant,
  authorize(['institute_admin', 'staff']),
  validateBody(createOtherIncomeSchema),
  asyncHandler(createOtherIncomeHandler)
);

// GET /api/v1/financial/income
financialRouter.get(
  '/income',
  authenticate, requireTenant,
  authorize(['institute_admin', 'staff']),
  asyncHandler(listOtherIncomeHandler)
);

// GET /api/v1/financial/income/:id
financialRouter.get(
  '/income/:id',
  authenticate, requireTenant,
  authorize(['institute_admin', 'staff']),
  validateParams(otherIncomeIdParamSchema),
  asyncHandler(getOtherIncomeHandler)
);

// PUT /api/v1/financial/income/:id
financialRouter.put(
  '/income/:id',
  authenticate, requireTenant,
  authorize(['institute_admin', 'staff']),
  validateParams(otherIncomeIdParamSchema),
  validateBody(updateOtherIncomeSchema),
  asyncHandler(updateOtherIncomeHandler)
);

// DELETE /api/v1/financial/income/:id
financialRouter.delete(
  '/income/:id',
  authenticate, requireTenant,
  authorize(['institute_admin']),
  validateParams(otherIncomeIdParamSchema),
  asyncHandler(deleteOtherIncomeHandler)
);

// ── Reports ───────────────────────────────────────────────────────────────────

// GET /api/v1/financial/profit-loss
financialRouter.get(
  '/profit-loss',
  authenticate, requireTenant,
  authorize(['institute_admin', 'staff']),
  validateQuery(dateRangeSchema),
  asyncHandler(profitLossHandler)
);

// GET /api/v1/financial/balance-sheet
financialRouter.get(
  '/balance-sheet',
  authenticate, requireTenant,
  authorize(['institute_admin', 'staff']),
  asyncHandler(balanceSheetHandler)
);

// GET /api/v1/financial/reports/monthly?year=2024&month=1
financialRouter.get(
  '/reports/monthly',
  authenticate, requireTenant,
  authorize(['institute_admin', 'staff']),
  validateQuery(monthlyFinancialReportQuerySchema),
  asyncHandler(monthlyFinancialReportHandler)
);

// GET /api/v1/financial/reports/yearly?year=2024
financialRouter.get(
  '/reports/yearly',
  authenticate, requireTenant,
  authorize(['institute_admin', 'staff']),
  validateQuery(yearlyFinancialReportQuerySchema),
  asyncHandler(yearlyFinancialReportHandler)
);

// GET /api/v1/financial/settings/tax
financialRouter.get(
  '/settings/tax',
  authenticate, requireTenant,
  authorize(['institute_admin', 'staff']),
  asyncHandler(getTaxSettingsHandler)
);

// PUT /api/v1/financial/settings/tax
financialRouter.put(
  '/settings/tax',
  authenticate, requireTenant,
  authorize(['institute_admin']),
  validateBody(upsertTaxSettingsSchema),
  asyncHandler(upsertTaxSettingsHandler)
);

// GET /api/v1/financial/gst-report?from=YYYY-MM-DD&to=YYYY-MM-DD
financialRouter.get(
  '/gst-report',
  authenticate, requireTenant,
  authorize(['institute_admin', 'staff']),
  validateQuery(gstReportQuerySchema),
  asyncHandler(gstReportHandler)
);

// GET /api/v1/financial/export/tally?from=YYYY-MM-DD&to=YYYY-MM-DD&format=xml|excel
financialRouter.get(
  '/export/tally',
  authenticate, requireTenant,
  authorize(['institute_admin', 'staff']),
  validateQuery(tallyExportQuerySchema),
  asyncHandler(tallyExportHandler)
);
