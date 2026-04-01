import express from 'express';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

import { db } from '../db/pool.js';
import { config } from '../config/index.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { code, nickName, avatarUrl } = req.body;
  //console.log('req.body',req.body)
  if (!code) {
    return res.status(400).json({ error: 'code is required' });
  }

  try {
    // 1️⃣ 获取 openid
    const wxRes = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: config.wechat.appid,
        secret: config.wechat.secret,
        js_code: code,
        grant_type: 'authorization_code',
      },
    });
    const { openid } = wxRes.data;
    // 2️⃣ 查用户
    const [rows] = await db.execute(
      'SELECT * FROM user WHERE open_id = ?', 
      [openid]
    );
    //console.log('row',rows)
    let user;

    if (rows.length === 0) {
      // 3️⃣ 新用户 → 插入
      const userId = uuidv4();

      await db.execute(
        `
        INSERT INTO user 
        (user_id, open_id, nick_name, avatar_url, created_time) 
        VALUES (?, ?, ?, ?, NOW())
        `,
        [userId, openid, nickName, avatarUrl]
      );

      user = {
        user_id: userId,
        open_id: openid,
        nick_name: nickName,
        avatar_url: avatarUrl
      };

    } else {
      // 4️⃣ 老用户 → 直接用数据库数据
      user = rows[0];

      // （可选）更新最新头像昵称
      if (nickName || avatarUrl) {
        await db.execute(
          `
          UPDATE user 
          SET nick_name = ?, avatar_url = ?
          WHERE open_id = ?
          `,
          [nickName || user.nick_name, avatarUrl || user.avatar_url, openid]
        );
      }
    }

    // 5️⃣ 返回统一结构
    res.send({ 
      code: 0,
      msg: '来自后端登录成功',
      data: {
        userId: user.user_id,
        openid: openid,
        nickName: user.nick_name,
        avatarUrl: user.avatar_url
      }
    });

  } catch (err) {
    console.error(err);
    res.send({ code: 1, msg: '来自后端登录失败' });
  }
});

export default router;