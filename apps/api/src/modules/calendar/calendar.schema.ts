import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  event_type: z.enum(['exam', 'holiday', 'meeting', 'event']).default('event'),
  start_date: z.string().min(1, 'start_date is required'),
  end_date: z.string().min(1, 'end_date is required'),
  location: z.string().optional(),
  target_type: z.enum(['all', 'batch', 'individual']).default('all'),
  target_id: z.string().uuid().optional()
});

export const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  event_type: z.enum(['exam', 'holiday', 'meeting', 'event']).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  location: z.string().optional(),
  target_type: z.enum(['all', 'batch', 'individual']).optional(),
  target_id: z.string().uuid().optional()
});

export const eventIdParamSchema = z.object({
  id: z.string().uuid()
});
