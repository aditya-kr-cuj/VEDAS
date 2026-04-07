import { z } from 'zod';

export const availabilityIdParamSchema = z.object({
  availabilityId: z.string().uuid(),
  id: z.string().uuid()
});

export const createAvailabilitySchema = z.object({
  dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  isAvailable: z.boolean().optional(),
  reason: z.string().max(200).optional()
});

export const updateAvailabilitySchema = z.object({
  dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  isAvailable: z.boolean().optional(),
  reason: z.string().max(200).optional()
});
