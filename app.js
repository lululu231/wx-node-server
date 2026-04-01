import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRouter from './src/routes/auth.js';
import communityRouter from './src/routes/community.js';
import uploadRouter from './src/routes/upload.js';
import userInfoRouter from './src/routes/userInfo.js'
import { initRedis, closeRedis } from './src/db/redisClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

app.use('/', authRouter);
app.use('/community', communityRouter);
app.use('/', uploadRouter);
app.use('/user', userInfoRouter)

// 静态资源映射，本地文件可通过 URL 访问
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 初始化 Redis 连接（在 index.js 启动前调用）
initRedis().catch((err) => {
  console.error('Failed to connect to Redis', err);
});

process.on('SIGINT', async () => {
  await closeRedis();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeRedis();
  process.exit(0);
});

export default app;
