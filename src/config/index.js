import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  mysql: {
    host: process.env.MYSQL_HOST ?? 'localhost',
    port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
    user: process.env.MYSQL_USER ?? 'root',
    password: process.env.MYSQL_PASSWORD ?? '123456',
    database: process.env.MYSQL_DATABASE ?? 'interest_app',
    connectionLimit: process.env.MYSQL_CONNECTION_LIMIT ? Number(process.env.MYSQL_CONNECTION_LIMIT) : 10,
  },
  wechat: {
    appid: process.env.WX_APPID,
    secret: process.env.WX_SECRET,
  },
  redis: {
    url: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
    defaultTTL: process.env.REDIS_TTL ? Number(process.env.REDIS_TTL) : 600,
  },
};
