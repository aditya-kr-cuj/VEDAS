import { z } from 'zod';

export const timetableEntryIdParamSchema = z.object({
  id: z.string().uuid()
});

export const timetableBatchParamSchema = z.object({
  batchId: z.string().uuid()
});

export const timetableTeacherParamSchema = z.object({
  teacherId: z.string().uuid()
});

export const createTimetableEntrySchema = z.object({
  batchId: z.string().uuid(),
  courseId: z.string().uuid(),
  teacherUserId: z.string().uuid(),
  roomId: z.string().uuid(),
  timeSlotId: z.string().uuid(),
  dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
});

export const updateTimetableEntrySchema = z.object({
  batchId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  teacherUserId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
  timeSlotId: z.string().uuid().optional(),
  dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).optional()
});
