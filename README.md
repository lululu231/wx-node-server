# 微信小程序后端

这是一个基于 Node.js + Express 的微信小程序后端示例，包含 MySQL 数据库连接及 SQL 结构文件。

## 目录结构

```
├── src
│   ├── app.js            # Express 应用（路由注册）
│   ├── index.js          # 入口文件（启动服务器）
│   ├── config
│   │   └── index.js      # 配置（dotenv + 环境变量）
│   ├── db
│   │   └── pool.js       # MySQL 连接池
│   └── routes
│       └── auth.js       # 登录相关接口
├── sql
│   └── schema.sql        # 数据库建表脚本
├── .env.example          # 环境变量示例
├── .gitignore
├── package.json
└── README.md
```

## 快速开始

1. 复制环境变量示例：

```bash
cp .env.example .env
```

2. 安装依赖：

```bash
npm install
```

3. 准备数据库：

使用 MySQL 客户端执行 `sql/schema.sql`：

```bash
mysql -u root -p < sql/schema.sql
```

4. 启动服务器：

```bash
npm start
```

5. 访问接口：

- POST `/api/login` (JSON body: `{ "code": "..." }`)

## 开发

```bash
npm run dev
```

## 环境变量说明

- `MYSQL_HOST`、`MYSQL_USER`、`MYSQL_PASSWORD`、`MYSQL_DATABASE`：数据库连接
- `WX_APPID`、`WX_SECRET`：微信小程序凭证
- `REDIS_URL`：Redis 连接地址（默认 `redis://localhost:6379`）
- `REDIS_TTL`：Redis 缓存过期（秒，默认 `600`）
