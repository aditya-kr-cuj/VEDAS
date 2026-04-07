import { z } from 'zod';

export const createFeeStructureSchema = z.object({
  name: z.string().min(2).max(120),
  feeType: z.enum(['course_wise', 'batch_wise', 'custom']),
  amount: z.number().positive(),
  frequency: z.enum(['one_time', 'monthly', 'quarterly', 'yearly']),
  courseId: z.string().uuid().optional(),
  batchId: z.string().uuid().optional(),
  lateFeeAmount: z.number().min(0).optional(),
  lateFeeAfterDays: z.number().int().min(0).optional()
});

export const assignFeeSchema = z.object({
  feeStructureId: z.string().uuid(),
  studentIds: z.array(z.string().uuid()).min(1),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export const recordPaymentSchema = z.object({
  studentId: z.string().uuid(),
  studentFeeId: z.string().uuid(),
  amount: z.number().positive(),
  paymentMode: z.enum(['cash', 'online', 'cheque', 'upi']),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  transactionId: z.string().max(120).optional(),
  remarks: z.string().max(200).optional()
});

export const createPaymentLinkSchema = z.object({
  studentFeeId: z.string().uuid(),
  amount: z.number().positive()
});
