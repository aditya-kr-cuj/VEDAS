import { whatsappQueue } from './whatsapp.queue.js';
import { sendWhatsAppTemplate } from '../../utils/whatsapp.js';
import { markWhatsAppLogSent, markWhatsAppLogFailed } from './whatsapp.repository.js';
import type Bull from 'bull';

whatsappQueue.process(async (job: Bull.Job) => {
  const { logId, to, templateName, templateParams, language } = job.data;

  try {
    const result = await sendWhatsAppTemplate({
      to,
      templateName,
      templateParams: templateParams ?? [],
      language
    });
    await markWhatsAppLogSent({ logId, messageId: result.messageId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed';
    await markWhatsAppLogFailed({ logId, errorMessage });
    throw error; // let Bull handle retries
  }
});
