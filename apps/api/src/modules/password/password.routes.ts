import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { validateBody } from '../../middleware/validate.js';
import { passwordResetConfirmSchema, passwordResetRequestSchema } from './password.schema.js';
import { confirmPasswordResetHandler, requestPasswordResetHandler } from './password.controller.js';

export const passwordRouter = Router();

passwordRouter.post('/request', validateBody(passwordResetRequestSchema), asyncHandler(requestPasswordResetHandler));
passwordRouter.post('/confirm', validateBody(passwordResetConfirmSchema), asyncHandler(confirmPasswordResetHandler));
