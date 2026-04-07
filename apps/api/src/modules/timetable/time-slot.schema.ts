import { z } from 'zod';

export const dayOfWeekSchema = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
]);

export const timeSlotIdParamSchema = z.object({
  id: z.string().uuid()
});

export const createTimeSlotSchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  slotNumber: z.number().int().min(1)
});

export const updateTimeSlotSchema = z.object({
  dayOfWeek: dayOfWeekSchema.optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  slotNumber: z.number().int().min(1).optional()
});
