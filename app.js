import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRouter from './src/routes/auth.js';
import communityRouter from './src/routes/community.js';
import uploadRouter from './src/routes/upload.js';
import userInfoRouter from './src/routes/userInfo.js'
import { initRedis, closeRedis } from './src/db/redisClient.js';
import departmentRouter from './src/routes/department.js'
import communityEventRouter from './src/routes/event.js';
import noticeRouter from './src/routes/notice.js'
import topicRouter from './src/routes/topic.js'
import albumRouter from './src/routes/album.js'
import notificationRoutes from './src/routes/notification.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

app.use('/', authRouter);
app.use('/community', communityRouter);
app.use('/', uploadRouter);
app.use('/user', userInfoRouter)
app.use('/department',departmentRouter)
app.use('/event',communityEventRouter)
app.use('/notice',noticeRouter)
app.use('/topic',topicRouter)
app.use('/',albumRouter)
app.use('/notification', notificationRoutes);

// 静态资源映射，本地文件可通过 URL 访问
console.log('静态目录:', path.resolve('uploads'))
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
