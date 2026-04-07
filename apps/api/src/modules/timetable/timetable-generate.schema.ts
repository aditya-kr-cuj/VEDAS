import { z } from 'zod';

export const generateTimetableSchema = z.object({
  batchId: z.string().uuid(),
  courses: z
    .array(
      z.object({
        courseId: z.string().uuid(),
        teacherUserId: z.string().uuid(),
        lecturesPerWeek: z.number().int().min(1),
        preferredTimeSlotIds: z.array(z.string().uuid()).optional()
      })
    )
    .min(1)
});

export const applyTimetableSchema = z.object({
  entries: z
    .array(
      z.object({
        batchId: z.string().uuid(),
        courseId: z.string().uuid(),
        teacherUserId: z.string().uuid(),
        roomId: z.string().uuid(),
        timeSlotId: z.string().uuid(),
        dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
      })
    )
    .min(1)
});
