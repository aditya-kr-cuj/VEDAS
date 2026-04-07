import { smsQueue } from './sms.queue.js';
import { sendSms } from '../../utils/sms.js';
import { markSmsLogSent, markSmsLogFailed, deductCredits } from './sms.repository.js';
import type Bull from 'bull';

smsQueue.process(async (job: Bull.Job) => {
  const { logId, tenantId, to, message } = job.data;

  // Check credits before sending
  const credited = await deductCredits(tenantId, 1);
  if (!credited) {
    await markSmsLogFailed({ logId, errorMessage: 'Insufficient SMS credits' });
    throw new Error('Insufficient SMS credits');
  }

  try {
    await sendSms({ to, message });
    await markSmsLogSent({ logId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed';
    await markSmsLogFailed({ logId, errorMessage });
    throw error; // let Bull handle retries
  }
});
