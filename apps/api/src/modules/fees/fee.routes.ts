import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { assignFeeStructureHandler, createFeeStructureHandler, listFeeStructuresHandler } from './fee.controller.js';
import { assignFeeSchema, createFeeStructureSchema, createPaymentLinkSchema, recordPaymentSchema } from './fee.schema.js';
import {
  listPaymentHistoryHandler,
  receiptHandler,
  recordPaymentHandler
} from './payment.controller.js';
import {
  dailyReportHandler,
  listDueFeesHandler,
  listOverdueFeesHandler,
  monthlyReportHandler,
  myFeesHandler,
  studentStatementHandler,
  summaryReportHandler
} from './fee-report.controller.js';
import { createPaymentLinkHandler, razorpayWebhookHandler } from './razorpay.controller.js';

export const feeRouter = Router();

feeRouter.post(
  '/structures',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateBody(createFeeStructureSchema),
  asyncHandler(createFeeStructureHandler)
);

feeRouter.get(
  '/structures',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  asyncHandler(listFeeStructuresHandler)
);

feeRouter.post(
  '/assign',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateBody(assignFeeSchema),
  asyncHandler(assignFeeStructureHandler)
);

feeRouter.post(
  '/payments',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'staff']),
  validateBody(recordPaymentSchema),
  asyncHandler(recordPaymentHandler)
);

feeRouter.get(
  '/student/:studentId/history',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'staff']),
  asyncHandler(listPaymentHistoryHandler)
);

feeRouter.get(
  '/payments/:paymentId/receipt',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'staff']),
  asyncHandler(receiptHandler)
);

feeRouter.get(
  '/due',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'staff']),
  asyncHandler(listDueFeesHandler)
);

feeRouter.get(
  '/overdue',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'staff']),
  asyncHandler(listOverdueFeesHandler)
);

feeRouter.get(
  '/reports/summary',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'staff']),
  asyncHandler(summaryReportHandler)
);

feeRouter.get(
  '/reports/daily',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'staff']),
  asyncHandler(dailyReportHandler)
);

feeRouter.get(
  '/reports/monthly',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'staff']),
  asyncHandler(monthlyReportHandler)
);

feeRouter.get(
  '/my',
  authenticate,
  requireTenant,
  authorize(['student']),
  asyncHandler(myFeesHandler)
);

feeRouter.get(
  '/reports/student/:studentId',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'staff']),
  asyncHandler(studentStatementHandler)
);

feeRouter.post(
  '/create-payment-link',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'staff', 'student']),
  validateBody(createPaymentLinkSchema),
  asyncHandler(createPaymentLinkHandler)
);

feeRouter.post('/webhook/razorpay', asyncHandler(razorpayWebhookHandler));
