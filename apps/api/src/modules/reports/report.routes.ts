import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.js';
import { generateReportHandler, reportPdfHandler, bulkReportHandler } from './report.controller.js';

export const reportRouter = Router();

reportRouter.post(
  '/reports/generate',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  asyncHandler(generateReportHandler)
);

reportRouter.get(
  '/reports/:id/pdf',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  asyncHandler(reportPdfHandler)
);

reportRouter.post(
  '/reports/bulk-generate',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  asyncHandler(bulkReportHandler)
);
