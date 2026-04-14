// src/routes/communityEventRoutes.js
import express from 'express';
import { createEventController ,
    fetchEvents,
    cancelEventController,
    joinEvent,
    cancelEventAttend,
    getMyCalendarEvents} from '../controller/eventController.js';

const router = express.Router();

// POST /community/event  → 新建活动
router.post('/event', createEventController);
//查活动
router.get('/all', fetchEvents);
router.post('/:id/cancel', cancelEventController);

// 报名
router.post('/join', joinEvent);

// 取消报名
router.post('/cancelEvent', cancelEventAttend);
// 日历数据接口
router.get('/myCalendar', getMyCalendarEvents);
export default router;