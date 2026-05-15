import { emailQueue } from './email.queue.js';
import { sendEmail } from '../../utils/email.js';
import { buildEmailTemplate } from '../../utils/email-templates.js';
import { markEmailLogFailed, markEmailLogSent } from './email.repository.js';
import type Bull from 'bull';

emailQueue.process(async (job: Bull.Job) => {
  const { logId, to, templateName, data } = job.data;
  try {
    const template = buildEmailTemplate(templateName, data);
    await sendEmail({ to, subject: template.subject, body: template.html });
    await markEmailLogSent({ logId });
  } catch (error) {
    await markEmailLogFailed({ logId, errorMessage: error instanceof Error ? error.message : 'Failed' });
    throw error;
  }
});
