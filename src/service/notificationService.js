import { db } from '../db/pool.js';

// ======================
// 列表
// ======================
export const getNotificationListService = async (params) => {
    const { userId, category } = params;

    const list = await getNotificationListDao({
        userId,
        category
    });

    return list;
};

// ======================
// 已读
// ======================
export const markAsReadService = async (id) => {
    return await markAsReadDao(id);
};

// ======================
// 未读数量
// ======================
export const getUnreadCountService = async (userId) => {
    return await getUnreadCountDao(userId);
};
// ======================
// 查询通知列表
// ======================
export const getNotificationListDao = async ({
    userId,
    category
}) => {

    let sql = `
        SELECT *
        FROM notification
        WHERE user_id = ?
    `;

    const params = [userId];

    if (category && category !== 'all') {
        sql += ` AND category = ?`;
        params.push(category);
    }

    sql += ` ORDER BY created_at DESC`;

    const [rows] = await db.execute(sql, params);
    return rows;
};

// ======================
// 标记已读
// ======================
export const markAsReadDao = async (id) => {
    const sql = `
        UPDATE notification
        SET is_read = 1
        WHERE id = ?
    `;

    const [result] = await db.execute(sql, [id]);
    return result;
    };

// ======================
// 未读数量
// ======================
export const getUnreadCountDao = async (userId) => {
    const sql = `
        SELECT COUNT(*) as count
        FROM notification
        WHERE user_id = ? AND is_read = 0
    `;

    const [[result]] = await db.execute(sql, [userId]);
    return result.count;
};
// ======================
// 时间格式化（核心修复）
// ======================
const formatDateTime = (date) => {
    if (!date) return null;

    const d = new Date(date);

    // 转 MySQL DATETIME
    return d.toISOString()
        .slice(0, 19)
        .replace('T', ' ');
};

// ======================
// 安全 JSON
// ======================
const safeJson = (data) => {
    if (data === null || data === undefined) return null;
    if (typeof data === 'string') return data;

    try {
        return JSON.stringify(data);
    } catch (err) {
        return null;
    }
};

// ======================
// 主函数
// ======================
export const createNotification = async ({
    userId,
    type,
    category,
    title,
    content,

    relatedId = null,
    relatedType = null,
    actorId = null,

    actionResult = null,
    actionStatus = null,

    eventTime = null,
    remindTime = null,

    extra = null
}) => {

    const sql = `
        INSERT INTO notification (
            user_id,
            type,
            category,
            title,
            content,
            is_read,

            related_id,
            related_type,
            actor_id,

            action_result,
            action_status,

            event_time,
            remind_time,

            extra
        )
        VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        userId,
        type,
        category,
        title,
        content,

        relatedId,
        relatedType,
        actorId,

        actionResult,
        actionStatus,

        // ======================
        // 🔥 核心修复点
        // ======================
        formatDateTime(eventTime),
        formatDateTime(remindTime),

        safeJson(extra)
    ];

    await db.execute(sql, params);
};