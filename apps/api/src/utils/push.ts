import { env } from '../config/env.js';

const FCM_SEND_URL = 'https://fcm.googleapis.com/fcm/send';

interface PushPayload {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function sendPushNotification(payload: PushPayload): Promise<{ success: number; failure: number }> {
  if (!env.FCM_SERVER_KEY) {
    console.warn('[Push] FCM_SERVER_KEY missing. Push not sent.');
    return { success: 0, failure: 0 };
  }

  if (payload.tokens.length === 0) {
    return { success: 0, failure: 0 };
  }

  try {
    const body = {
      registration_ids: payload.tokens,
      notification: {
        title: payload.title,
        body: payload.body,
        sound: 'default'
      },
      ...(payload.data ? { data: payload.data } : {})
    };

    const response = await fetch(FCM_SEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${env.FCM_SERVER_KEY}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[Push] FCM HTTP ${response.status}: ${text}`);
      return { success: 0, failure: payload.tokens.length };
    }

    const result = (await response.json()) as { success: number; failure: number };
    return { success: result.success ?? 0, failure: result.failure ?? 0 };
  } catch (error) {
    console.error('[Push] FCM send error:', error instanceof Error ? error.message : error);
    return { success: 0, failure: payload.tokens.length };
  }
}
