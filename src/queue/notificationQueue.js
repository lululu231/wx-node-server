import { Queue } from 'bullmq';
import { bullConnection } from '../config/bullmq.redis.js';

export const notificationQueue = new Queue('notification', {
    connection: bullConnection
});