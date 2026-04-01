import express from 'express';
import { getAvatar,updateUser } from '../controller/userController.js'
const router = express.Router();

//console.log('userInfo')
// 获取头像接口 (改为GET请求)
router.get('/avatarUrl', getAvatar);
//更新用户信息
router.post('/update', updateUser);
export default router;