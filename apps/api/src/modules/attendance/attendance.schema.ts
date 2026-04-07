import { z } from 'zod';

export const attendanceStatusSchema = z.enum(['present', 'absent', 'late', 'excused']);

export const markAttendanceSchema = z.object({
  batchId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeSlotId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  attendance: z
    .array(
      z.object({
        studentId: z.string().uuid(),
        status: attendanceStatusSchema,
        remarks: z.string().max(200).optional()
      })
    )
    .min(1)
});

export const attendanceIdParamSchema = z.object({
  id: z.string().uuid()
});

export const attendanceBatchParamSchema = z.object({
  batchId: z.string().uuid()
});

export const attendanceStudentParamSchema = z.object({
  studentId: z.string().uuid()
});

export const updateAttendanceSchema = z.object({
  status: attendanceStatusSchema.optional(),
  remarks: z.string().max(200).optional()
});
