import dotenv from 'dotenv';
dotenv.config();

import { smsQueue } from '../modules/notifications/sms.queue.js';
import { sendSms } from '../utils/sms.js';
import { markSmsLogSent, markSmsLogFailed, deductCredits } from '../modules/notifications/sms.repository.js';
import type Bull from 'bull';

const PREFIX = '[SmsWorker]';

// ── Process jobs ────────────────────────────────────────────────
smsQueue.process(async (job: Bull.Job) => {
  const { logId, tenantId, to, message } = job.data;
  console.log(`${PREFIX} Processing job ${job.id} — to=${to}`);

  // Deduct credit atomically
  const credited = await deductCredits(tenantId, 1);
  if (!credited) {
    await markSmsLogFailed({ logId, errorMessage: 'Insufficient SMS credits' });
    console.error(`${PREFIX} ✗ Job ${job.id} failed — insufficient credits`);
    throw new Error('Insufficient SMS credits');
  }

  try {
    await sendSms({ to, message });
    await markSmsLogSent({ logId });
    console.log(`${PREFIX} ✓ Job ${job.id} sent successfully`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed';
    await markSmsLogFailed({ logId, errorMessage });
    console.error(`${PREFIX} ✗ Job ${job.id} failed — ${errorMessage}`);
    throw error;
  }
});

// ── Event listeners ─────────────────────────────────────────────
smsQueue.on('completed', (job: Bull.Job) => {
  console.log(`${PREFIX} Job ${job.id} completed`);
});

smsQueue.on('failed', (job: Bull.Job, err: Error) => {
  console.error(`${PREFIX} Job ${job.id} failed after ${job.attemptsMade} attempts — ${err.message}`);
});

smsQueue.on('stalled', (jobId: string) => {
  console.warn(`${PREFIX} Job ${jobId} stalled — will be reprocessed`);
});

smsQueue.on('error', (err: Error) => {
  console.error(`${PREFIX} Queue error —`, err.message);
});

// ── Graceful shutdown ───────────────────────────────────────────
async function shutdown() {
  console.log(`${PREFIX} Shutting down gracefully...`);
  await smsQueue.close();
  console.log(`${PREFIX} Queue closed. Exiting.`);
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log(`${PREFIX} Worker started — listening for SMS jobs`);
