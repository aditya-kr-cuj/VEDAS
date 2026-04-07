import { env } from '../config/env.js';

const MSG91_SEND_URL = 'https://control.msg91.com/api/v5/flow/';
const MSG91_BALANCE_URL = 'https://control.msg91.com/api/v5/balance.php';

function sanitizePhone(phone: string): string {
  // Strip all non-digit characters, ensure leading country code
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) cleaned = cleaned.slice(1);
  // Default to India (+91) if no country code
  if (cleaned.length === 10) cleaned = '91' + cleaned;
  return cleaned;
}

async function sendWithRetry(
  payload: { to: string; message: string },
  retries = 2
): Promise<{ requestId?: string }> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      const phone = sanitizePhone(payload.to);

      const response = await fetch(MSG91_SEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authkey: env.MSG91_AUTH_KEY
        },
        body: JSON.stringify({
          sender: env.MSG91_SENDER_ID,
          route: '4', // transactional
          country: '91',
          sms: [
            {
              message: payload.message,
              to: [phone]
            }
          ],
          ...(env.MSG91_DLT_TE_ID ? { DLT_TE_ID: env.MSG91_DLT_TE_ID } : {})
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`MSG91 HTTP ${response.status}: ${text}`);
      }

      const data = (await response.json()) as { type?: string; request_id?: string; message?: string };
      if (data.type === 'error') {
        throw new Error(`MSG91 error: ${data.message ?? 'Unknown error'}`);
      }

      return { requestId: data.request_id };
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (attempt > retries) break;
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }

  throw lastError instanceof Error ? lastError : new Error('SMS delivery failed');
}

export async function sendSms(payload: { to: string; message: string }): Promise<void> {
  if (!env.MSG91_AUTH_KEY) {
    console.warn('[SMS] MSG91_AUTH_KEY missing. SMS not sent.', payload.to);
    return;
  }

  await sendWithRetry(payload);
}

export async function getSmsBalance(): Promise<number | null> {
  if (!env.MSG91_AUTH_KEY) return null;

  try {
    const url = `${MSG91_BALANCE_URL}?authkey=${encodeURIComponent(env.MSG91_AUTH_KEY)}&type=4`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const text = await response.text();
    const balance = Number(text);
    return isNaN(balance) ? null : balance;
  } catch {
    return null;
  }
}
