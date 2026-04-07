import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import {
  deleteMaterialHandler,
  downloadMaterialHandler,
  getMaterialHandler,
  grantAccessHandler,
  listMaterialsHandler,
  materialAnalyticsHandler,
  searchMaterialsHandler,
  createTagHandler,
  listTagsHandler,
  createCategoryHandler,
  listCategoriesHandler,
  updateMaterialFileHandler,
  listMaterialVersionsHandler,
  bookmarkMaterialHandler,
  removeBookmarkHandler,
  listBookmarksHandler,
  analyticsSummaryHandler,
  bulkUploadMaterialsHandler,
  updateMaterialHandler,
  uploadMaterialHandler
} from './material.controller.js';
import { createCategorySchema, createTagSchema, grantAccessSchema, materialIdParamSchema } from './material.schema.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }
});

export const materialRouter = Router();

materialRouter.post(
  '/upload',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  upload.single('file'),
  asyncHandler(uploadMaterialHandler)
);

materialRouter.post(
  '/bulk-upload',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  upload.array('files', 20),
  asyncHandler(bulkUploadMaterialsHandler)
);

materialRouter.post(
  '/tags',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  validateBody(createTagSchema),
  asyncHandler(createTagHandler)
);

materialRouter.get(
  '/tags',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher', 'student']),
  asyncHandler(listTagsHandler)
);

materialRouter.post(
  '/categories',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  validateBody(createCategorySchema),
  asyncHandler(createCategoryHandler)
);

materialRouter.get(
  '/categories',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher', 'student']),
  asyncHandler(listCategoriesHandler)
);

materialRouter.get(
  '/analytics/summary',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  asyncHandler(analyticsSummaryHandler)
);

materialRouter.get(
  '/',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher', 'student']),
  asyncHandler(listMaterialsHandler)
);

materialRouter.get(
  '/search',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher', 'student']),
  asyncHandler(searchMaterialsHandler)
);

materialRouter.get(
  '/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher', 'student']),
  validateParams(materialIdParamSchema),
  asyncHandler(getMaterialHandler)
);

materialRouter.post(
  '/:id/download',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher', 'student']),
  validateParams(materialIdParamSchema),
  asyncHandler(downloadMaterialHandler)
);

materialRouter.get(
  '/:id/analytics',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  validateParams(materialIdParamSchema),
  asyncHandler(materialAnalyticsHandler)
);

materialRouter.put(
  '/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  validateParams(materialIdParamSchema),
  asyncHandler(updateMaterialHandler)
);

materialRouter.put(
  '/:id/file',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  validateParams(materialIdParamSchema),
  upload.single('file'),
  asyncHandler(updateMaterialFileHandler)
);

materialRouter.get(
  '/:id/versions',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  validateParams(materialIdParamSchema),
  asyncHandler(listMaterialVersionsHandler)
);

materialRouter.post(
  '/:id/bookmark',
  authenticate,
  requireTenant,
  authorize(['student']),
  validateParams(materialIdParamSchema),
  asyncHandler(bookmarkMaterialHandler)
);

materialRouter.delete(
  '/:id/bookmark',
  authenticate,
  requireTenant,
  authorize(['student']),
  validateParams(materialIdParamSchema),
  asyncHandler(removeBookmarkHandler)
);

materialRouter.get(
  '/bookmarks',
  authenticate,
  requireTenant,
  authorize(['student']),
  asyncHandler(listBookmarksHandler)
);

materialRouter.delete(
  '/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  validateParams(materialIdParamSchema),
  asyncHandler(deleteMaterialHandler)
);

materialRouter.post(
  '/:id/access',
  authenticate,
  requireTenant,
  authorize(['institute_admin', 'teacher']),
  validateParams(materialIdParamSchema),
  validateBody(grantAccessSchema),
  asyncHandler(grantAccessHandler)
);
