import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import { getRazorpayClient, verifyWebhookSignature } from './razorpay.service.js';
import { recordPayment } from './payment.repository.js';
import { query } from '../../db/client.js';
import { env } from '../../config/env.js';
import { findStudentProfileByUserId } from '../students/student.repository.js';

export async function createPaymentLinkHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const razorpay = getRazorpayClient();
  if (!razorpay) throw new HttpError(500, 'Razorpay not configured');

  const [fee] = await query<{ id: string; due_amount: string; student_id: string }>(
    `SELECT id, due_amount, student_id FROM student_fees WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
    [tenantId, req.body.studentFeeId]
  );
  if (!fee) throw new HttpError(404, 'Student fee record not found');

  if (req.role === 'student') {
    const userId = req.auth?.userId;
    if (!userId) throw new HttpError(401, 'Authentication required');
    const profile = await findStudentProfileByUserId(tenantId, userId);
    if (!profile || profile.id !== fee.student_id) {
      throw new HttpError(403, 'Not allowed to pay for this fee');
    }
  }

  const amount = Math.min(Number(fee.due_amount), req.body.amount);
  if (amount <= 0) throw new HttpError(400, 'No dues remaining');

  const paymentLink = await razorpay.paymentLink.create({
    amount: Math.round(amount * 100),
    currency: 'INR',
    description: 'VEDAS fee payment',
    callback_url: `${env.APP_BASE_URL}/portal/student?payment=success`,
    callback_method: 'get',
    notes: {
      tenantId,
      studentFeeId: fee.id,
      studentId: fee.student_id
    }
  });

  res.status(201).json({ link: paymentLink.short_url, id: paymentLink.id });
}

export async function razorpayWebhookHandler(req: Request, res: Response): Promise<void> {
  const signature = req.headers['x-razorpay-signature']?.toString() ?? '';
  const rawBody = req.bodyRaw as string | undefined;
  if (!rawBody) {
    throw new HttpError(400, 'Raw body required for webhook');
  }

  const ok = verifyWebhookSignature(rawBody, signature);
  if (!ok) {
    throw new HttpError(400, 'Invalid webhook signature');
  }

  const event = JSON.parse(rawBody);
  if (event.event !== 'payment.captured') {
    res.status(200).json({ received: true });
    return;
  }

  const payload = event.payload.payment.entity;
  const notes = payload.notes || {};
  const tenantId = notes.tenantId;
  const studentFeeId = notes.studentFeeId;
  const studentId = notes.studentId;

  if (!tenantId || !studentFeeId || !studentId) {
    throw new HttpError(400, 'Missing metadata');
  }

  const existing = await query<{ id: string }>(
    `SELECT id FROM fee_payments WHERE tenant_id = $1 AND transaction_id = $2 LIMIT 1`,
    [tenantId, payload.id]
  );
  if (existing[0]) {
    res.status(200).json({ received: true });
    return;
  }

  await recordPayment({
    tenantId,
    studentId,
    studentFeeId,
    amount: payload.amount / 100,
    paymentMode: 'online',
    paymentDate: new Date().toISOString().slice(0, 10),
    transactionId: payload.id,
    remarks: 'Razorpay payment',
    collectedBy: null
  });

  res.status(200).json({ received: true });
}
