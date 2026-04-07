import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import {
  csvTemplateHandler,
  deleteStudentHandler,
  getMyStudentProfileHandler,
  getStudentHandler,
  updateStudentHandler,
  bulkUploadStudentsHandler
} from './student.controller.js';
import { studentIdParamSchema, updateStudentSchema } from './student.schema.js';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const name = file.originalname.toLowerCase();
    if (name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only .csv or .xlsx files are allowed'));
  }
});

export const studentRouter = Router();

studentRouter.get(
  '/me',
  authenticate,
  requireTenant,
  asyncHandler(getMyStudentProfileHandler)
);

studentRouter.get(
  '/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateParams(studentIdParamSchema),
  asyncHandler(getStudentHandler)
);

studentRouter.put(
  '/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateParams(studentIdParamSchema),
  validateBody(updateStudentSchema),
  asyncHandler(updateStudentHandler)
);

studentRouter.delete(
  '/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateParams(studentIdParamSchema),
  asyncHandler(deleteStudentHandler)
);

studentRouter.post(
  '/bulk-upload',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  upload.single('file'),
  asyncHandler(bulkUploadStudentsHandler)
);

studentRouter.get(
  '/csv-template',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  asyncHandler(csvTemplateHandler)
);
