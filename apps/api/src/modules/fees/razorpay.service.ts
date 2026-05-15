import Razorpay from 'razorpay';
import crypto from 'node:crypto';
import { env } from '../../config/env.js';

let razorpayClient: Razorpay | null = null;

export function getRazorpayClient() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    return null;
  }

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET
    });
  }

  return razorpayClient;
}

export function verifyWebhookSignature(body: string, signature: string) {
  const secret = env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const digest = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return digest === signature;
}
