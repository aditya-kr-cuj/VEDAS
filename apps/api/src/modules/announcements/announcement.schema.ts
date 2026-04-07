import { z } from 'zod';

export const createAnnouncementSchema = z.object({
  title: z.string().min(3).max(160),
  message: z.string().min(5),
  announcement_type: z.enum(['general', 'urgent', 'event', 'holiday']).optional(),
  target_type: z.enum(['all', 'batch', 'individual']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  scheduled_at: z.string().optional(),
  expires_at: z.string().optional(),
  is_pinned: z.boolean().optional(),
  batch_ids: z.array(z.string().uuid()).optional(),
  student_ids: z.array(z.string().uuid()).optional(),
  teacher_ids: z.array(z.string().uuid()).optional()
});

export const announcementIdParamSchema = z.object({
  id: z.string().uuid()
});
