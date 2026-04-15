import express from 'express';

import {
    getNotificationList,
    markAsRead,
    getUnreadCount
} from '../controller/notificationController.js';

const router = express.Router();

// 列表
router.get('/list', getNotificationList);

// 已读
router.post('/read', markAsRead);

// 未读数量
router.get('/unreadCount', getUnreadCount);

export default router;