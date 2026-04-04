import { Resend } from 'resend';
import { env } from '../config/env.js';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function sendWithRetry(payload: { to: string; subject: string; html: string }, retries = 2): Promise<void> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      await resend!.emails.send({
        from: env.EMAIL_FROM,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: stripHtml(payload.html)
      });
      return;
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (attempt > retries) break;
      await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Email delivery failed');
}

export async function sendEmail(payload: { to: string; subject: string; body: string }): Promise<void> {
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY missing. Email not sent.', payload.to, payload.subject);
    return;
  }

  await sendWithRetry({ to: payload.to, subject: payload.subject, html: payload.body });
}
