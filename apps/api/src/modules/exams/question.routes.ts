import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import {
  bulkImportHandler,
  createQuestionHandler,
  deleteQuestionHandler,
  getQuestionHandler,
  listQuestionsHandler,
  updateQuestionHandler
} from './question.controller.js';
import { createQuestionSchema, questionIdParamSchema, updateQuestionSchema } from './question.schema.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

export const questionRouter = Router();

questionRouter.post(
  '/',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  upload.single('file'),
  validateBody(createQuestionSchema),
  asyncHandler(createQuestionHandler)
);

questionRouter.get(
  '/',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  asyncHandler(listQuestionsHandler)
);

questionRouter.get(
  '/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  validateParams(questionIdParamSchema),
  asyncHandler(getQuestionHandler)
);

questionRouter.put(
  '/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  upload.single('file'),
  validateParams(questionIdParamSchema),
  validateBody(updateQuestionSchema),
  asyncHandler(updateQuestionHandler)
);

questionRouter.delete(
  '/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  validateParams(questionIdParamSchema),
  asyncHandler(deleteQuestionHandler)
);

questionRouter.post(
  '/bulk-import',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  upload.single('file'),
  asyncHandler(bulkImportHandler)
);
