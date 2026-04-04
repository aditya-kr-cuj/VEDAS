import { z } from 'zod';

export const staffIdParamSchema = z.object({
  id: z.string().uuid()
});

export const createStaffSchema = z.object({
  fullName: z.string().min(3).max(100),
  email: z.string().email(),
  password: z.string().min(6)
});

export const updateStaffSchema = z.object({
  fullName: z.string().min(3).max(100).optional()
});
