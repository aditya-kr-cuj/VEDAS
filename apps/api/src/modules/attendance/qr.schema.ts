import { z } from 'zod';

export const generateQrSchema = z.object({
  batchId: z.string().uuid(),
  courseId: z.string().uuid().optional(),
  timeSlotId: z.string().uuid().optional(),
  expiresInMinutes: z.number().int().min(1).max(60).optional()
});

export const scanQrSchema = z.object({
  token: z.string().min(10)
});
