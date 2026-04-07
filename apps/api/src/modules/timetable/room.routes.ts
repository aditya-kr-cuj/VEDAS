import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import {
  createRoomHandler,
  deleteRoomHandler,
  getRoomHandler,
  listRoomsHandler,
  updateRoomHandler
} from './room.controller.js';
import { createRoomSchema, roomIdParamSchema, updateRoomSchema } from './room.schema.js';

export const roomRouter = Router();

roomRouter.get('/', authenticate, requireTenant, asyncHandler(listRoomsHandler));

roomRouter.get(
  '/:id',
  authenticate,
  requireTenant,
  validateParams(roomIdParamSchema),
  asyncHandler(getRoomHandler)
);

roomRouter.post(
  '/',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateBody(createRoomSchema),
  asyncHandler(createRoomHandler)
);

roomRouter.put(
  '/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateParams(roomIdParamSchema),
  validateBody(updateRoomSchema),
  asyncHandler(updateRoomHandler)
);

roomRouter.delete(
  '/:id',
  authenticate,
  requireTenant,
  authorize(['institute_admin']),
  validateParams(roomIdParamSchema),
  asyncHandler(deleteRoomHandler)
);
