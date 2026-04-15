import { db } from '../db/pool.js';


/**
 * 查询公告列表
 */
export const getNoticeListService = async ({
    community_id,
    type,
    page = 1,
    pageSize = 10
    }) => {

    let sql = `
        SELECT 
        n.id,
        n.title,
        n.content,
        n.type,
        n.attachment,
        n.created_at,
        u.nick_name AS creator_name
        FROM notice n
        LEFT JOIN user u ON n.creator_id = u.user_id  -- ✅ 修复这里
        WHERE n.community_id = ?
    `;

    const params = [community_id];

    if (type) {
        sql += ` AND n.type = ?`;
        params.push(type);
    }

    sql += ` ORDER BY n.type = 'top' DESC, n.created_at DESC`;

    const offset = (page - 1) * pageSize;
    sql += ` LIMIT ?, ?`;
    params.push(offset, Number(pageSize));

    const [rows] = await db.query(sql, params);

    return rows;
};
/**
 * 创建公告
 */
export const createNoticeService = async ({
    title,
    content,
    type,
    attachment,
    creator_id,
    community_id   // ✅ 新增
    }) => {

    const sql = `
        INSERT INTO notice
        (title, content, type, attachment, creator_id, community_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    const params = [
        title,
        content,
        type,
        attachment || null,
        creator_id,
        community_id
    ];

    const [result] = await db.query(sql, params);

    return {
        id: result.insertId
    };
};

    /**
     * 修改公告
     */
export const updateNoticeService = async (params) => {
    const {
        id,
        title,
        content,
        type,
        attachment
    } = params;

    let sql = `UPDATE notice SET `;
    const fields = [];
    const values = [];

    if (title !== undefined) {
        fields.push('title = ?');
        values.push(title);
    }

    if (content !== undefined) {
        fields.push('content = ?');
        values.push(content);
    }

    if (type !== undefined) {
        fields.push('type = ?');
        values.push(type);
    }

    if (attachment !== undefined) {
        fields.push('attachment = ?');
        values.push(attachment);
    }

    sql += fields.join(', ') + ' WHERE id = ?';
    values.push(id);

    const [result] = await db.execute(sql, values);

    return result;
};