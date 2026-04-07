import Queue from 'bull';
import { env } from '../../config/env.js';

export const emailQueue = new Queue('email-queue', env.REDIS_URL || 'redis://127.0.0.1:6379');
