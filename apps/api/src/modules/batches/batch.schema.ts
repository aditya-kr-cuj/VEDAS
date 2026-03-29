import { z } from 'zod';

export const createBatchSchema = z.object({
  courseId: z.string().uuid(),
  name: z.string().min(2).max(120),
  schedule: z.string().max(200).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

export const updateBatchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  schedule: z.string().max(200).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional()
});

export const assignStudentSchema = z.object({
  studentUserId: z.string().uuid()
});
