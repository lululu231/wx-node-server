import { db } from '../db/pool.js'

/**
 * 查询某个帖子
 */
export const getTopicByIdService = async (topicId) => {
    const sql = `
        SELECT 
        t.*,
        u.nick_name,
        u.avatar_url
        FROM community_topic t
        LEFT JOIN user u
        ON t.user_id = u.user_id
        WHERE t.topic_id = ?
    `

    const [rows] = await db.execute(sql, [topicId])

    return rows[0]
}
/**
 * 查询帖子列表（不分页）
 */
export const getTopicListService = async (community_id) => {

    let sql = `
        SELECT 
        t.topic_id,
        t.community_id,
        t.community_name, -- ✅ 直接返回（不用再查）
        t.user_id,
        t.title,
        t.content,
        t.image_urls,     -- ✅ 新增
        t.like_count,
        t.comment_count,
        t.view_count,
        t.created_at,
        u.nick_name,
        u.avatar_url
        FROM community_topic t
        LEFT JOIN user u ON t.user_id = u.user_id
        WHERE t.status = 'normal'
    `

    const params = []

    if (community_id && Number(community_id) !== 0) {
        sql += ` AND t.community_id = ?`
        params.push(community_id)
    }

    sql += ` ORDER BY t.created_at DESC`

    const [rows] = await db.query(sql, params)

    // ✅ 处理图片 JSON → 数组
    const list = rows.map(item => ({
        ...item,
        image_urls: item.image_urls ? JSON.parse(item.image_urls) : []
    }))

    return list
}
/**
 * 创建帖子
 */
export const createTopicService = async ({
    community_id,
    user_id,
    title,
    content,
    image_urls
    }) => {

    // ✅ 1. 查询社团名称（冗余存储）
    const [communityRows] = await db.query(
        `SELECT community_name FROM community WHERE id = ?`,
        [community_id]
    )

    const community_name = communityRows[0]?.community_name || ''

    // ✅ 2. 图片转 JSON
    const imageUrlsStr = JSON.stringify(image_urls || [])

    // ✅ 3. 插入帖子
    const sql = `
        INSERT INTO community_topic 
        (community_id, community_name, user_id, title, content, image_urls, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    `

    const [result] = await db.query(sql, [
        community_id,
        community_name,
        user_id,
        title,
        content,
        imageUrlsStr
    ])

    return result.insertId
}