import dotenv from 'dotenv';
dotenv.config();

import { emailQueue } from '../modules/notifications/email.queue.js';
import { sendEmail } from '../utils/email.js';
import { buildEmailTemplate } from '../utils/email-templates.js';
import { markEmailLogFailed, markEmailLogSent } from '../modules/notifications/email.repository.js';

const PREFIX = '[EmailWorker]';

// ── Process jobs ────────────────────────────────────────────────
emailQueue.process(async (job) => {
  const { logId, to, templateName, data } = job.data;
  console.log(`${PREFIX} Processing job ${job.id} — template=${templateName} to=${to}`);

  try {
    const template = buildEmailTemplate(templateName, data);
    await sendEmail({ to, subject: template.subject, body: template.html });
    await markEmailLogSent({ logId });
    console.log(`${PREFIX} ✓ Job ${job.id} sent successfully`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    await markEmailLogFailed({ logId, errorMessage: message });
    console.error(`${PREFIX} ✗ Job ${job.id} failed — ${message}`);
    throw error; // let Bull handle retries
  }
});

// ── Event listeners ─────────────────────────────────────────────
emailQueue.on('completed', (job) => {
  console.log(`${PREFIX} Job ${job.id} completed`);
});

emailQueue.on('failed', (job, err) => {
  console.error(`${PREFIX} Job ${job.id} failed after ${job.attemptsMade} attempts — ${err.message}`);
});

emailQueue.on('stalled', (jobId) => {
  console.warn(`${PREFIX} Job ${jobId} stalled — will be reprocessed`);
});

emailQueue.on('error', (err) => {
  console.error(`${PREFIX} Queue error —`, err.message);
});

// ── Graceful shutdown ───────────────────────────────────────────
async function shutdown() {
  console.log(`${PREFIX} Shutting down gracefully...`);
  await emailQueue.close();
  console.log(`${PREFIX} Queue closed. Exiting.`);
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log(`${PREFIX} Worker started — listening for email jobs`);
