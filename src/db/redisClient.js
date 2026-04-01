import { createClient } from 'redis';
import { config } from '../config/index.js';

export const redisClient = createClient({ url: config.redis.url });

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

redisClient.on('connect', () => {
  console.log('Redis client connected');
});

export const initRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

export const closeRedis = async () => {
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
};

