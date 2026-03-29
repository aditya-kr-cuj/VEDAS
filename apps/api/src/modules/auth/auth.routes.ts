import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import {
  createStudentSchema,
  createTeacherSchema,
  createStaffSchema,
  loginSchema,
  refreshSchema,
  registerInstituteSchema,
  bulkCsvSchema,
  verifyEmailSchema
} from './auth.schema.js';
import {
  createStudentHandler,
  createTeacherHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  refreshHandler,
  registerInstituteHandler,
  verifyEmailHandler,
  createStaffHandler,
  bulkCreateStudentsHandler
} from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/register-institute', validateBody(registerInstituteSchema), asyncHandler(registerInstituteHandler));
authRouter.post('/login', validateBody(loginSchema), asyncHandler(loginHandler));
authRouter.post('/refresh', validateBody(refreshSchema), asyncHandler(refreshHandler));
authRouter.post('/logout', authenticate, asyncHandler(logoutHandler));
authRouter.get('/me', authenticate, asyncHandler(meHandler));
authRouter.post('/verify-email', validateBody(verifyEmailSchema), asyncHandler(verifyEmailHandler));

authRouter.post(
  '/teacher',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateBody(createTeacherSchema),
  asyncHandler(createTeacherHandler)
);

authRouter.post(
  '/student',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateBody(createStudentSchema),
  asyncHandler(createStudentHandler)
);

authRouter.post(
  '/staff',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateBody(createStaffSchema),
  asyncHandler(createStaffHandler)
);

authRouter.post(
  '/students/bulk',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateBody(bulkCsvSchema),
  asyncHandler(bulkCreateStudentsHandler)
);
