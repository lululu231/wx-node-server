import {getAvatarService,updateUserService} from '../service/userService.js'
// 数据库查询用户
export const getAvatar = async (req, res) => {
    try {
        const { user_id } = req.query;

        if (!user_id) {
            return res.json({ code: 1, msg: '缺少user_id' });
        }

        const result = await getAvatarService(user_id);

        if (!result) {
            return res.json({ code: 1, msg: '用户不存在' });
        }

        res.json({
            code: 0,
            msg: 'success',
            data: result
        });

    } catch (e) {
        console.error('查询用户失败：', e);
        res.status(500).json({ code: 1, msg: '服务器错误' });
    }
};
//更新用户数据
export const updateUser = async (req, res) => {
  try {
    //console.log('req.body', req.body);

    const { user_id } = req.body;

    if (!user_id) {
      return res.send({ code: 1, msg: '缺少user_id' });
    }

    const result = await updateUserService(req.body);

    if (!result) {
      return res.send({ code: 1, msg: '用户不存在或未更新' });
    }

    res.send({ code: 0, msg: '更新成功', data: result });

  } catch (err) {
    console.error('更新失败详细错误：', err);
    res.send({ code: 1, msg: '更新失败', error: err.message });
  }
};


 
