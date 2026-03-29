import { z } from 'zod';

export const sendNotificationSchema = z.object({
  recipientUserId: z.string().uuid(),
  subject: z.string().min(3).max(200),
  body: z.string().min(3).max(2000)
});
