import { z } from 'zod';

export const studentIdParamSchema = z.object({
  id: z.string().uuid()
});

export const updateStudentSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  email: z.string().email().max(255).optional(),
  rollNumber: z.string().max(50).optional(),
  className: z.string().max(100).optional(),
  guardianName: z.string().max(120).optional(),
  guardianPhone: z.string().max(30).optional()
});
