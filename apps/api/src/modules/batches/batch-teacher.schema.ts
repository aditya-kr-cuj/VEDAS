import { z } from 'zod';

export const batchIdParamSchema = z.object({
  id: z.string().uuid()
});

export const batchTeacherParamsSchema = z.object({
  batchId: z.string().uuid(),
  teacherId: z.string().uuid()
});

export const assignTeacherToBatchSchema = z.object({
  teacherUserId: z.string().uuid(),
  courseId: z.string().uuid().optional()
});
