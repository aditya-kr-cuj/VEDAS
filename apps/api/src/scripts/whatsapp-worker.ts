import dotenv from 'dotenv';
dotenv.config();

import { whatsappQueue } from '../modules/notifications/whatsapp.queue.js';
import { sendWhatsAppTemplate } from '../utils/whatsapp.js';
import { markWhatsAppLogSent, markWhatsAppLogFailed } from '../modules/notifications/whatsapp.repository.js';
import type Bull from 'bull';

const PREFIX = '[WhatsAppWorker]';

// ── Process jobs ────────────────────────────────────────────────
whatsappQueue.process(async (job: Bull.Job) => {
  const { logId, to, templateName, templateParams, language } = job.data;
  console.log(`${PREFIX} Processing job ${job.id} — template=${templateName} to=${to}`);

  try {
    const result = await sendWhatsAppTemplate({
      to,
      templateName,
      templateParams: templateParams ?? [],
      language
    });
    await markWhatsAppLogSent({ logId, messageId: result.messageId });
    console.log(`${PREFIX} ✓ Job ${job.id} sent successfully (msgId=${result.messageId})`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed';
    await markWhatsAppLogFailed({ logId, errorMessage });
    console.error(`${PREFIX} ✗ Job ${job.id} failed — ${errorMessage}`);
    throw error;
  }
});

// ── Event listeners ─────────────────────────────────────────────
whatsappQueue.on('completed', (job: Bull.Job) => {
  console.log(`${PREFIX} Job ${job.id} completed`);
});

whatsappQueue.on('failed', (job: Bull.Job, err: Error) => {
  console.error(`${PREFIX} Job ${job.id} failed after ${job.attemptsMade} attempts — ${err.message}`);
});

whatsappQueue.on('stalled', (jobId: string) => {
  console.warn(`${PREFIX} Job ${jobId} stalled — will be reprocessed`);
});

whatsappQueue.on('error', (err: Error) => {
  console.error(`${PREFIX} Queue error —`, err.message);
});

// ── Graceful shutdown ───────────────────────────────────────────
async function shutdown() {
  console.log(`${PREFIX} Shutting down gracefully...`);
  await whatsappQueue.close();
  console.log(`${PREFIX} Queue closed. Exiting.`);
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log(`${PREFIX} Worker started — listening for WhatsApp jobs`);
