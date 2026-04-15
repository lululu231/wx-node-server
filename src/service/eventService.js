// src/service/communityEventService.js
import { db } from '../db/pool.js';
// src/service/communityEventService.js
/**
 * 获取当前用户报名的活动（用于日历）
 */
export const getMyCalendarEventsService = async (userId) => {
    const sql = `
        SELECT 
            e.id,
            e.title,
            e.start_time,
            e.end_time,
            e.community_id
        FROM event_participant ep
        JOIN community_event e ON ep.event_id = e.id
        WHERE ep.user_id = ?
            AND ep.status = 'joined'
        ORDER BY e.start_time ASC
    `;

    const [rows] = await db.query(sql, [userId]);
    return rows;
};

/**
 * 报名活动（事务版 + 返回活动信息）
 */
export const joinEventService = async (eventId, userId) => {
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // ======================
        // 1️⃣ 查询活动信息（保留你的逻辑）
        // ======================
        const [[event]] = await conn.execute(
        `SELECT id, title, start_time, participant_count, max_count
        FROM community_event 
        WHERE id = ?`,
        [eventId]
        );

        if (!event) {
        throw new Error('活动不存在');
        }

        // ======================
        // 2️⃣ 查用户报名状态
        // ======================
        const [exist] = await conn.execute(
        `SELECT id, status 
        FROM event_participant 
        WHERE event_id = ? AND user_id = ?`,
        [eventId, userId]
        );

        if (exist.length > 0 && exist[0].status === 'joined') {
        throw new Error('已经报名过了');
        }

        // ======================
        // 3️⃣ 写入报名（支持取消后再报名）
        // ======================
        if (exist.length === 0) {
        await conn.execute(
            `INSERT INTO event_participant (event_id, user_id, status)
            VALUES (?, ?, 'joined')`,
            [eventId, userId]
        );
        } else {
        await conn.execute(
            `UPDATE event_participant 
            SET status = 'joined'
            WHERE event_id = ? AND user_id = ?`,
            [eventId, userId]
        );
        }

        // ======================
        // 4️⃣ 原子更新人数（关键优化点）
        // ======================
        const [result] = await conn.execute(
        `UPDATE community_event 
        SET participant_count = participant_count + 1
        WHERE id = ? AND participant_count < max_count`,
        [eventId]
        );

        if (result.affectedRows === 0) {
        throw new Error('活动人数已满');
        }

        // ======================
        // 5️⃣ 提交事务
        // ======================
        await conn.commit();

        // ======================
        // 6️⃣ 返回完整活动信息（保留你的设计）
        // ======================
        return {
        id: event.id,
        name: event.title,
        start_time: event.start_time,
        participant_count: event.participant_count + 1,
        max_count: event.max_count
        };

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

/**
 * 取消报名
 */
export const cancelEventAttendService = async (eventId, userId) => {
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // 1️⃣ 判断是否已报名
        const [exist] = await conn.execute(
        `SELECT * FROM event_participant 
        WHERE event_id = ? AND user_id = ? AND status = 'joined'`,
        [eventId, userId]
        );

        if (exist.length === 0) {
        throw new Error('未报名该活动');
        }

        // 2️⃣ 更新状态
        await conn.execute(
        `UPDATE event_participant 
        SET status = 'cancelled'
        WHERE event_id = ? AND user_id = ?`,
        [eventId, userId]
        );

        // 3️⃣ 人数 -1
        await conn.execute(
        `UPDATE community_event 
        SET participant_count = participant_count - 1
        WHERE id = ? AND participant_count > 0`,
        [eventId]
        );

        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};
/**
 * 取消活动
 * @param {number} eventId 活动ID
 * @returns {Promise<boolean>} 是否取消成功
 */
export async function cancelEvent(eventId) {
    // 先查询活动是否存在
    const [rows] = await db.query(
        `SELECT id, status FROM community_event WHERE id = ?`,
        [eventId]
    );

    if (!rows.length) {
        throw new Error('活动不存在');
    }

    const event = rows[0];

    if (event.status === 'cancelled') {
        throw new Error('活动已取消，无需重复操作');
    }

    // 更新状态为 cancelled
    const [result] = await db.query(
        `UPDATE community_event SET status = 'cancelled' WHERE id = ?`,
        [eventId]
    );

    return result.affectedRows === 1;
}
/**
 * 查询活动列表，支持多条件查询
 * @param {Object} options
 * @param {number} options.communityId
 * @param {string} options.status
 * @param {string} options.title
 * @param {string} options.startTime
 * @param {string} options.endTime
 */
export async function getEvents(options = {}) {
    const { communityId, status, title, startTime, endTime, userId } = options;

    let sql = `
        SELECT 
            e.*, 
            e.event_description,
            c.community_name, 
            c.avatar_url, 
            c.description as community_description,
            c.proof_url, 
            c.status as community_status, 
            c.creator_id
    `;

    // ✅ 是否需要 isJoined
    if (userId) {
        sql += `,
            CASE 
                WHEN ep.user_id IS NOT NULL THEN 1
                ELSE 0
            END AS isJoined
        `;
    } else {
        sql += `,
            0 AS isJoined
        `;
    }

    sql += `
        FROM community_event e
        JOIN community c ON e.community_id = c.id
    `;

    // ✅ 只有有 userId 才 JOIN
    if (userId) {
        sql += `
            LEFT JOIN event_participant ep
            ON e.id = ep.event_id
            AND ep.user_id = ?
            AND ep.status = 'joined'
        `;
    }

    sql += ` WHERE 1=1`;

    const params = [];

    // ⚠️ 顺序要对
    if (userId) {
        params.push(userId);
    }

    if (communityId) {
        sql += ` AND e.community_id = ?`;
        params.push(communityId);
    }

    if (status) {
        sql += ` AND e.status = ?`;
        params.push(status);
    }

    if (title) {
        sql += ` AND e.title LIKE ?`;
        params.push(`%${title}%`);
    }

    if (startTime) {
        sql += ` AND e.start_time >= ?`;
        params.push(startTime);
    }

    if (endTime) {
        sql += ` AND e.end_time <= ?`;
        params.push(endTime);
    }

    sql += ` ORDER BY e.start_time ASC`;

    const [rows] = await db.query(sql, params);
    return rows;
}

// 新建活动
export const upsertEvent = async ({
    id, // 可选：已有活动的 ID
    community_id,
    title,
    event_description,
    start_time,
    end_time,
    location,
    admin_id,
    max_count,
    album_name,
    cover_url
}) => {
    if (id) {
        // 如果传了 id，先尝试更新
        const sqlUpdate = `
            UPDATE community_event
            SET title=?, event_description=?, start_time=?, end_time=?, location=?,
                admin_id=?, max_count=?, album_name=?, cover_url=?
            WHERE id=?
        `;
        const [result] = await db.execute(sqlUpdate, [
            title,
            event_description,
            start_time,
            end_time,
            location,
            admin_id,
            max_count || null,
            album_name || null,
            cover_url || null,
            id
        ]);
        return id;
    } else {
        // 否则新增
        const sqlInsert = `
            INSERT INTO community_event
            (community_id, title, event_description, start_time, end_time, location, admin_id, status, created_at, max_count, album_name, cover_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), ?, ?, ?)
        `;
        const [result] = await db.execute(sqlInsert, [
            community_id,
            title,
            event_description,
            start_time,
            end_time,
            location,
            admin_id,
            max_count || null,
            album_name || null,
            cover_url || null
        ]);
        return result.insertId;
    }
};