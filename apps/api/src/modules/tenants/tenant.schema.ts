import { z } from 'zod';

export const updateTenantProfileSchema = z.object({
  addressLine1: z.string().min(3).max(200).optional(),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(2).max(100).optional(),
  state: z.string().min(2).max(100).optional(),
  pincode: z.string().min(4).max(10).optional(),
  kycIdNumber: z.string().min(4).max(50).optional(),
  kycDocumentUrl: z.string().url().optional(),
  customDomain: z.string().max(200).optional(),
  planKey: z.string().min(2).max(30).optional()
});
