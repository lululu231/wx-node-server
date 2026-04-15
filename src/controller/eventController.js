// src/controller/communityEventController.js
import { upsertEvent,
    getEvents,
    cancelEvent,
    joinEventService,
    cancelEventAttendService,
    getMyCalendarEventsService 
} from '../service/eventService.js';

import { notificationQueue } from '../queue/notificationQueue.js';
// const formatDateTime = (date) => {
//     if (!date) return null;

//     const d = new Date(date);

//     return d.toISOString()
//         .slice(0, 19)
//         .replace('T', ' ');
// };
//查活动
// controller/communityEventController.js
import { db } from '../db/pool.js';
// src/controller/communityEventController.js

export const getMyCalendarEvents = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.send({
                code: 1,
                message: 'userId不能为空'
            });
        }

        const list = await getMyCalendarEventsService(userId);

        res.send({
            code: 0,
            data: list
        });

    } catch (err) {
        console.error(err);
        res.status(500).send({
            code: 1,
            message: '获取日历数据失败'
        });
    }
};

export const joinEvent = async (req, res) => {
    const { eventId, userId } = req.body;

    if (!eventId || !userId) {
        return res.send({ code: 1, message: '参数缺失' });
    }

    try {
        // ======================
        // 1️⃣ 写入报名关系
        // ======================
        const event = await joinEventService(eventId, userId);
        // event 建议返回活动信息（name, start_time）

        // ======================
        // 2️⃣ 立即通知：报名成功
        // ======================
        await notificationQueue.add('EVENT_JOIN', {
        type: 'EVENT_JOIN',
        userId,
        eventId,
        eventName: event.name,
        actorId: userId
        });

        // ======================
        // 3️⃣ 延迟通知：活动提醒（提前1天）
        // ======================
        const startTime = new Date(event.start_time);
        const remindTime = new Date(startTime);
        remindTime.setDate(remindTime.getDate() - 1);

        // const delay = remindTime.getTime() - Date.now();
        const delay=5000
        console.log('⏰ 时间计算:', {
            startTime: event.start_time,
            remindTime,
            delay
            });
        console.log('📤 进逻辑了 EVENT_REMIND job');
        if (delay > 0) {
            // console.log('📤 准备创建 EVENT_REMIND job', {
            // eventId,
            // eventName,
            // delay,
            // now: Date.now()
            // });
        const job = await notificationQueue.add(
            'EVENT_REMIND',
            {
                type: 'EVENT_REMIND',
                userId,
                eventId,
                eventName:event.name,
                eventTime: event.start_time
            },
            { delay }
            );

            console.log('✅ EVENT_REMIND 已入队:', {
            jobId: job.id,
            state: await job.getState()
            });
        }

        // ======================
        // 4️⃣ 返回结果
        // ======================
        res.send({ code: 0, message: '报名成功' });

    } catch (err) {
        res.send({ code: 1, message: err.message });
    }
};

/**
 * 取消报名
 */
export const cancelEventAttend = async (req, res) => {
    const { eventId, userId } = req.body;

    if (!eventId || !userId) {
        return res.send({ code: 1, message: '参数缺失' });
    }

    try {
        await cancelEventAttendService(eventId, userId);
        res.send({ code: 0, message: '取消成功' });
    } catch (err) {
        res.send({ code: 1, message: err.message });
    }
};
/**
 * 取消活动接口
 * POST /events/:id/cancel
 */
export const cancelEventController = async (req, res) => {
    const { id } = req.params;

    try {
        const success = await cancelEvent(Number(id));
        if (success) {
        res.json({
            code: 0,
            message: '活动已成功取消'
        });
        } else {
        res.status(500).json({
            code: 1,
            message: '取消活动失败'
        });
        }
    } catch (err) {
        res.status(400).json({
        code: 1,
        message: err.message
        });
    }
};
export async function fetchEvents(req, res) {
    try {
        const { communityId, status, title, startTime, endTime, userId } = req.query;

        const events = await getEvents({
            communityId,
            status,
            title,
            startTime,
            endTime,
            userId   // ✅ 传下去
        });

        res.json({
            code: 0,
            data: events,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ code: 1, message: '查询活动失败' });
    }
}


export const createEventController = async (req, res) => {
    try {
        const {
        community_id,
        title,
        description,
        start_time,
        end_time,
        location,
        admin_id,
        max_count,
        album_name,
        cover_url
        } = req.body;

        // ------------------------
        // 1. 必填字段校验
        // ------------------------
        if (!community_id) {
        return res.status(400).json({ code:1, message:'community_id 必填' });
        }
        if (!title) {
        return res.status(400).json({ code:1, message:'title 必填' });
        }

        // ------------------------
        // 2. admin_id 不传 → 查询社长
        // ------------------------
        let finalAdminId = admin_id;
        if (!finalAdminId) {
        const [rows] = await db.execute(
            'SELECT owner_id FROM community WHERE id = ?',
            [community_id]
        );
        if (!rows || rows.length === 0) {
            return res.status(400).json({ code:1, message:'社团不存在，无法获取社长' });
        }
        finalAdminId = rows[0].owner_id;
        }

        // ------------------------
        // 3. 调用 upsertEvent 创建活动
        // ------------------------
        const eventId = await upsertEvent({
        community_id,
        title,
        event_description: description || null,
        start_time: start_time || null,
        end_time: end_time || null,
        location: location || null,
        admin_id: finalAdminId,
        max_count: max_count !== undefined ? max_count : null,
        album_name: album_name || null,
        cover_url: cover_url || null
        });

        return res.status(201).json({ code:0, message:'活动创建成功', data:eventId });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ code:1, message:'服务器内部错误', error: err.message });
    }
};