import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import { createRoom, deleteRoom, findRoomById, listRooms, updateRoom } from './room.repository.js';

export async function createRoomHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  const room = await createRoom({
    tenantId,
    roomName: req.body.roomName,
    roomType: req.body.roomType,
    capacity: req.body.capacity,
    isAvailable: req.body.isAvailable
  });

  res.status(201).json({ room });
}

export async function listRoomsHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  const rooms = await listRooms(tenantId);
  res.status(200).json({ rooms });
}

export async function getRoomHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  const room = await findRoomById(tenantId, req.params.id);
  if (!room) {
    throw new HttpError(404, 'Room not found');
  }

  res.status(200).json({ room });
}

export async function updateRoomHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  await updateRoom({
    tenantId,
    id: req.params.id,
    roomName: req.body.roomName,
    roomType: req.body.roomType,
    capacity: req.body.capacity,
    isAvailable: req.body.isAvailable
  });

  res.status(200).json({ message: 'Room updated' });
}

export async function deleteRoomHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  await deleteRoom({ tenantId, id: req.params.id });
  res.status(200).json({ message: 'Room deleted' });
}
