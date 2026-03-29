import { z } from 'zod';

export const createCourseSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  subjectCode: z.string().max(50).optional()
});

export const updateCourseSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(500).optional(),
  subjectCode: z.string().max(50).optional(),
  isActive: z.boolean().optional()
});

export const assignTeacherSchema = z.object({
  teacherUserId: z.string().uuid()
});
