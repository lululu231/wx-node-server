import express from 'express';
import {
    createNoticeController,
    updateNoticeController,
    getNoticeListController
} from '../controller/noticeC.js';

const router = express.Router();

router.post('/create', createNoticeController);
router.post('/update', updateNoticeController);
// ✅ 获取公告列表
router.get('/list', getNoticeListController);

export default router;