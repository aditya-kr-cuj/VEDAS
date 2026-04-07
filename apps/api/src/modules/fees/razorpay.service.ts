import Razorpay from 'razorpay';
import crypto from 'node:crypto';
import { env } from '../../config/env.js';

export function getRazorpayClient() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    return null;
  }

  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET
  });
}

export function verifyWebhookSignature(body: string, signature: string) {
  const secret = env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const digest = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return digest === signature;
}
