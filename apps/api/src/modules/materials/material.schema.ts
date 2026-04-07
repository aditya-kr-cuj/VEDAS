import { z } from 'zod';

export const materialIdParamSchema = z.object({
  id: z.string().uuid()
});

export const updateMaterialSchema = z.object({
  title: z.string().min(2).max(160).optional(),
  description: z.string().max(1000).optional(),
  topic: z.string().max(120).optional(),
  tags: z.array(z.string().max(40)).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
  isPublic: z.boolean().optional()
});

export const grantAccessSchema = z.object({
  studentIds: z.array(z.string().uuid()).optional(),
  batchIds: z.array(z.string().uuid()).optional()
});

export const createTagSchema = z.object({
  tagName: z.string().min(2).max(60),
  color: z.string().max(20).optional()
});

export const createCategorySchema = z.object({
  categoryName: z.string().min(2).max(120),
  parentCategoryId: z.string().uuid().optional()
});
