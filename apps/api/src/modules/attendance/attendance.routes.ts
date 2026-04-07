import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import {
  attendanceBatchParamSchema,
  attendanceIdParamSchema,
  attendanceStudentParamSchema,
  markAttendanceSchema,
  updateAttendanceSchema
} from './attendance.schema.js';
import { generateQrSchema, scanQrSchema } from './qr.schema.js';
import {
  listBatchAttendanceHandler,
  listStudentAttendanceHandler,
  markAttendanceHandler,
  updateAttendanceHandler
} from './attendance.controller.js';
import { generateQrHandler, scanQrHandler } from './qr.controller.js';

export const attendanceRouter = Router();

attendanceRouter.post(
  '/mark',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  validateBody(markAttendanceSchema),
  asyncHandler(markAttendanceHandler)
);

attendanceRouter.get(
  '/batch/:batchId',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  validateParams(attendanceBatchParamSchema),
  asyncHandler(listBatchAttendanceHandler)
);

attendanceRouter.get(
  '/student/:studentId',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  validateParams(attendanceStudentParamSchema),
  asyncHandler(listStudentAttendanceHandler)
);

attendanceRouter.put(
  '/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  validateParams(attendanceIdParamSchema),
  validateBody(updateAttendanceSchema),
  asyncHandler(updateAttendanceHandler)
);

attendanceRouter.post(
  '/generate-qr',
  authenticate,
  requireTenant,
  authorize(['teacher', 'institute_admin']),
  validateBody(generateQrSchema),
  asyncHandler(generateQrHandler)
);

attendanceRouter.post(
  '/scan-qr',
  authenticate,
  requireTenant,
  authorize(['student']),
  validateBody(scanQrSchema),
  asyncHandler(scanQrHandler)
);
