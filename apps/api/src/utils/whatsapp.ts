import { env } from '../config/env.js';

const WA_API_VERSION = 'v21.0';
const WA_BASE_URL = `https://graph.facebook.com/${WA_API_VERSION}`;

function sanitizePhone(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) cleaned = cleaned.slice(1);
  if (cleaned.length === 10) cleaned = '91' + cleaned;
  return cleaned;
}

interface SendTemplatePayload {
  to: string;
  templateName: string;
  templateParams: string[];
  language?: string;
}

interface SendResult {
  messageId?: string;
}

async function sendWithRetry(
  payload: SendTemplatePayload,
  retries = 2
): Promise<SendResult> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      const phone = sanitizePhone(payload.to);

      // Build template components
      const components: any[] = [];
      if (payload.templateParams.length > 0) {
        components.push({
          type: 'body',
          parameters: payload.templateParams.map((value) => ({
            type: 'text',
            text: value
          }))
        });
      }

      const body = {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: {
          name: payload.templateName,
          language: {
            code: payload.language ?? 'en'
          },
          ...(components.length > 0 ? { components } : {})
        }
      };

      const url = `${WA_BASE_URL}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`WhatsApp API HTTP ${response.status}: ${errBody}`);
      }

      const data = (await response.json()) as {
        messages?: Array<{ id: string }>;
        error?: { message: string };
      };

      if (data.error) {
        throw new Error(`WhatsApp API error: ${data.error.message}`);
      }

      return { messageId: data.messages?.[0]?.id };
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (attempt > retries) break;
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }

  throw lastError instanceof Error ? lastError : new Error('WhatsApp message delivery failed');
}

export async function sendWhatsAppTemplate(payload: SendTemplatePayload): Promise<SendResult> {
  if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    console.warn('[WhatsApp] WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID missing. Message not sent.', payload.to);
    return {};
  }

  return sendWithRetry(payload);
}
