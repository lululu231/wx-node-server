import { Worker } from 'bullmq';
import { bullConnection } from '../config/bullmq.redis.js';
import { createNotification } from '../service/notificationService.js';

const worker = new Worker(
    'notification',
    async (job) => {

        // ======================
        // 🔥 1️⃣ 最重要：确认 worker 是否收到 job
        // ======================
        console.log('\n========================');
        console.log('🔥 收到 JOB:', job.id);
        console.log('📦 name:', job.name);
        console.log('📥 data:', job.data);
        console.log('========================\n');

        const {
        type,
        userId,
        eventId,
        eventName,
        actorId = null,
        eventTime = null
        } = job.data;

        console.log('🎯 解析 type:', type);

        try {

        // =========================
        // 1️⃣ 活动审核类
        // =========================
        if (type === 'EVENT_APPROVED' || type === 'EVENT_REJECTED') {
            console.log('📌 进入：EVENT_AUDIT');

            const isApproved = type === 'EVENT_APPROVED';

            console.log('💾 正在写入通知：event_audit');

            const result = await createNotification({
            userId,
            type: 'event_audit',
            category: 'event',

            title: isApproved ? '活动审核通过' : '活动审核未通过',
            content: isApproved
                ? `你的活动【${eventName}】已通过审核`
                : `你的活动【${eventName}】未通过审核`,

            relatedId: eventId,
            relatedType: 'event',
            actorId,

            actionResult: isApproved ? 'approved' : 'rejected',
            actionStatus: 'finished',

            extra: { eventName }
            });

            console.log('✅ 写入成功 event_audit:', result);
        }

        // =========================
        // 2️⃣ 活动报名
        // =========================
        if (type === 'EVENT_JOIN') {
            console.log('📌 进入：EVENT_JOIN');

            const result = await createNotification({
            userId,
            type: 'event_join',
            category: 'event',

            title: '报名成功',
            content: `你已成功报名活动【${eventName}】`,

            relatedId: eventId,
            relatedType: 'event',
            actorId,

            actionResult: 'joined',
            actionStatus: 'success',

            extra: { eventName }
            });

            console.log('✅ 写入成功 EVENT_JOIN:', result);
        }

        // =========================
        // 3️⃣ 活动提醒
        // =========================
        if (type === 'EVENT_REMIND') {
            console.log('📌 进入：EVENT_REMIND');

            const result = await createNotification({
            userId,
            type: 'event_remind',
            category: 'remind',

            title: '活动即将开始',
            content: `你报名的活动【${eventName}】将于明天开始`,

            relatedId: eventId,
            relatedType: 'event',
            actorId,

            actionResult: 'upcoming',
            actionStatus: 'remind',

            eventTime,

            extra: { eventName }
            });

            console.log('✅ 写入成功 EVENT_REMIND:', result);
        }

        // =========================
        // 4️⃣ 社团
        // =========================
        if (type === 'JOIN_APPROVED' || type === 'JOIN_REJECTED') {
            console.log('📌 进入：COMMUNITY');

            const ok = type === 'JOIN_APPROVED';

            const result = await createNotification({
            userId,
            type: 'community_join_apply',
            category: 'community',

            title: ok ? '加入社团成功' : '加入社团失败',
            content: ok
                ? `你已成功加入社团【${eventName}】`
                : `你加入社团【${eventName}】的申请未通过`,

            relatedId: eventId,
            relatedType: 'community',
            actorId,

            actionResult: ok ? 'approved' : 'rejected',
            actionStatus: 'finished',

            extra: { communityName: eventName }
            });

            console.log('✅ 写入成功 COMMUNITY:', result);
        }

        // =========================
        // 5️⃣ 未知类型
        // =========================
        const knownTypes = [
            'EVENT_APPROVED',
            'EVENT_REJECTED',
            'EVENT_JOIN',
            'EVENT_CANCEL',
            'EVENT_REMIND',
            'JOIN_APPROVED',
            'JOIN_REJECTED'
        ];

        if (!knownTypes.includes(type)) {
            console.warn('⚠️ 未知通知类型:', type);
        }

        } catch (err) {
        console.error('❌ worker 执行失败:', {
            jobId: job.id,
            type,
            error: err.message,
            stack: err.stack
        });

        throw err;
        }
    },
    {
        connection: bullConnection
    }
    );

    // ======================
    // 6️⃣ worker 生命周期
    // ======================
    worker.on('completed', (job) => {
    console.log('🎉 JOB完成:', job.id, job.name);
    });

    worker.on('failed', (job, err) => {
    console.error('💥 JOB失败:', {
        id: job?.id,
        name: job?.name,
        data: job?.data,
        error: err?.message
    });
    });

    worker.on('error', (err) => {
    console.error('🔥 worker系统错误:', err);
});