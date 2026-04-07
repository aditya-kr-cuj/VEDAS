import { z } from 'zod';

export const createTestSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().optional(),
  course_id: z.string().uuid(),
  batch_id: z.string().uuid(),
  test_type: z.enum(['practice', 'quiz', 'midterm', 'final']).optional(),
  total_marks: z.coerce.number().optional(),
  passing_marks: z.coerce.number().optional(),
  duration_minutes: z.coerce.number().int().min(1),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  instructions: z.string().optional(),
  allow_review: z.boolean().optional(),
  shuffle_questions: z.boolean().optional(),
  shuffle_options: z.boolean().optional(),
  show_result_immediately: z.boolean().optional(),
  negative_marking: z.coerce.number().optional(),
  question_ids: z.any().optional()
});

export const updateTestSchema = createTestSchema.partial();

export const testIdParamSchema = z.object({
  id: z.string().uuid()
});
