import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { noticeBoardHandler } from './notice-board.controller.js';

export const noticeBoardRouter = Router();

// Public endpoint — no authentication
noticeBoardRouter.get(
  '/notice-board/:tenantId',
  asyncHandler(noticeBoardHandler)
);
