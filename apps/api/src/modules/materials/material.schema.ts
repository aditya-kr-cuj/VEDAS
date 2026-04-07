import { z } from 'zod';

export const materialIdParamSchema = z.object({
  id: z.string().uuid()
});

export const updateMaterialSchema = z.object({
  title: z.string().min(2).max(160).optional(),
  description: z.string().max(1000).optional(),
  topic: z.string().max(120).optional(),
  tags: z.array(z.string().max(40)).optional(),
  isPublic: z.boolean().optional()
});

export const grantAccessSchema = z.object({
  studentIds: z.array(z.string().uuid()).optional(),
  batchIds: z.array(z.string().uuid()).optional()
});
