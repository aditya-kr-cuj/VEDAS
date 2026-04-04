import { z } from 'zod';

export const teacherIdParamSchema = z.object({
  id: z.string().uuid()
});
