import { z } from 'zod';

const optionSchema = z.object({
  option_text: z.string().min(1),
  is_correct: z.boolean().default(false)
});

const blankSchema = z.object({
  blank_position: z.number().int().min(1),
  correct_answer: z.string().min(1),
  case_sensitive: z.boolean().optional().default(false)
});

export const createQuestionSchema = z.object({
  course_id: z.string().uuid(),
  topic: z.string().max(160).optional(),
  question_text: z.string().min(5),
  question_type: z.enum(['mcq', 'true_false', 'subjective', 'fill_blanks', 'multi_select']),
  difficulty_level: z.enum(['easy', 'medium', 'hard']),
  marks: z.coerce.number().positive(),
  created_by_teacher_id: z.string().uuid().optional(),
  explanation: z.string().optional(),
  media_url: z.string().url().optional(),
  options: z.any().optional(),
  blanks: z.any().optional(),
  rubric_text: z.string().optional(),
  rubric_marks: z.coerce.number().optional()
});

export const updateQuestionSchema = createQuestionSchema.partial();

export const questionIdParamSchema = z.object({
  id: z.string().uuid()
});
