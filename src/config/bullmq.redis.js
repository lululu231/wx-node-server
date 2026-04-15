import { Redis } from 'ioredis';
import { config } from './index.js';

export const bullConnection = new Redis(config.redis.url, {
    maxRetriesPerRequest: null
});