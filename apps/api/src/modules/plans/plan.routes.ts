import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { listPlansHandler } from './plan.controller.js';

export const planRouter = Router();

planRouter.get('/', asyncHandler(listPlansHandler));
