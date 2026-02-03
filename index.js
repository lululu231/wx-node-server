import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());

// 数据库连接池
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'interest_app'
});

// 登录接口
app.post('/api/login', async (req, res) => {
  const { code } = req.body;
  console.log('code',code)

  // 1. 请求微信服务器换 openid
  const wxRes = await axios.get(
    'https://api.weixin.qq.com/sns/jscode2session',
    {
      params: {
        appid: 'wx7112387cee752c6a',
        secret: 'ac930d4c68e1fe1e35fd6da70dba4b6e',
        js_code: code,
        grant_type: 'authorization_code'
      }
    }
  );
  if(!wxRes){
    console.log('获取err')
  }
  console.log('密钥',wxRes)
 const { openid } = wxRes.data;

  //2. 查数据库是否已有用户
  const [rows] = await db.execute(
    'SELECT * FROM user WHERE openid = ?',
    [openid]
  );

  // 3. 没有就插入
  if (rows.length === 0) {
    await db.execute(
      'INSERT INTO user (openid) VALUES (?)',
      [openid]
    );
  }

  res.json({ success: true, openid });
});

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
