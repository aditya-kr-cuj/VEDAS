import { z } from 'zod';

export const roomIdParamSchema = z.object({
  id: z.string().uuid()
});

export const roomTypeSchema = z.enum(['classroom', 'lab', 'auditorium']);

export const createRoomSchema = z.object({
  roomName: z.string().min(2).max(100),
  roomType: roomTypeSchema.optional(),
  capacity: z.number().int().min(0).optional(),
  isAvailable: z.boolean().optional()
});

export const updateRoomSchema = z.object({
  roomName: z.string().min(2).max(100).optional(),
  roomType: roomTypeSchema.optional(),
  capacity: z.number().int().min(0).optional(),
  isAvailable: z.boolean().optional()
});
