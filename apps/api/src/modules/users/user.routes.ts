import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.js';
import {
  deleteUserHandler,
  listTenantUsersHandler,
  updateMyProfileHandler,
  updateUserNameHandler,
  updateUserStatusHandler
} from './user.controller.js';
import { validateBody } from '../../middleware/validate.js';
import { updateProfileSchema, updateUserNameSchema, updateUserStatusSchema } from './user.schema.js';

export const userRouter = Router();

userRouter.get(
  '/',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  asyncHandler(listTenantUsersHandler)
);

userRouter.put('/me', authenticate, validateBody(updateProfileSchema), asyncHandler(updateMyProfileHandler));

userRouter.patch(
  '/:id/status',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateBody(updateUserStatusSchema),
  asyncHandler(updateUserStatusHandler)
);

userRouter.put(
  '/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateBody(updateUserNameSchema),
  asyncHandler(updateUserNameHandler)
);

userRouter.delete(
  '/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  asyncHandler(deleteUserHandler)
);
