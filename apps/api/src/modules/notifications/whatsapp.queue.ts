import Queue from 'bull';
import { env } from '../../config/env.js';

export const whatsappQueue = new Queue('whatsapp-queue', env.REDIS_URL || 'redis://127.0.0.1:6379');
