import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(72, 'Password must be at most 72 characters long')
  .regex(/[A-Z]/, 'Password must include one uppercase letter')
  .regex(/[a-z]/, 'Password must include one lowercase letter')
  .regex(/[0-9]/, 'Password must include one number');

export const registerInstituteSchema = z.object({
  instituteName: z.string().min(3).max(120),
  instituteSlug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase and URL-safe'),
  ownerName: z.string().min(3).max(100),
  ownerEmail: z.string().email(),
  ownerPhone: z.string().min(10).max(16).optional(),
  password: passwordSchema,
  planKey: z.string().min(2).max(30).optional(),
  addressLine1: z.string().min(3).max(200).optional(),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(2).max(100).optional(),
  state: z.string().min(2).max(100).optional(),
  pincode: z.string().min(4).max(10).optional(),
  kycIdNumber: z.string().min(4).max(50).optional(),
  kycDocumentUrl: z.string().url().optional(),
  customDomain: z.string().max(200).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20)
});

export const verifyEmailSchema = z.object({
  token: z.string().min(20)
});

export const createTeacherSchema = z.object({
  fullName: z.string().min(3).max(100),
  email: z.string().email(),
  password: passwordSchema
});

export const createStudentSchema = z.object({
  fullName: z.string().min(3).max(100),
  email: z.string().email(),
  password: passwordSchema
});

export const createStaffSchema = z.object({
  fullName: z.string().min(3).max(100),
  email: z.string().email(),
  password: passwordSchema
});

export const bulkCsvSchema = z.object({
  csv: z.string().min(1)
});
