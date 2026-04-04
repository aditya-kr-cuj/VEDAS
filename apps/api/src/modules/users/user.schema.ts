import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().min(3).max(100)
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean()
});

export const updateUserNameSchema = z.object({
  fullName: z.string().min(3).max(100)
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['student', 'teacher', 'staff'])
});
