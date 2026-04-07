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
  updateMaterialHandler,
  uploadMaterialHandler
} from './material.controller.js';
import { grantAccessSchema, materialIdParamSchema } from './material.schema.js';

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
