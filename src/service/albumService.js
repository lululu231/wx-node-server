import { db } from '../db/pool.js';
//上传图片
export const uploadPhotoService = async (data) => {
    const sql = `
        INSERT INTO community_photo
        (album_id, community_id, uploader_id, image_url)
        VALUES (?, ?, ?, ?)
    `;

    const [result] = await db.execute(sql, [
        data.album_id,
        data.community_id,
        data.uploader_id,
        data.image_url
    ]);

    return result;
};
//删除图片
export const deletePhotoService = async (photoId) => {
    const sql = `
        UPDATE community_photo
        SET status = 'deleted'
        WHERE photo_id = ?
    `;

    await db.execute(sql, [photoId]);
};
//删除分组
export const deleteAlbumService = async (albumId) => {
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // 1. 删除图片（软删）
        await conn.execute(
        `UPDATE community_photo SET status='deleted' WHERE album_id = ?`,
        [albumId]
        );

        // 2. 删除相册
        await conn.execute(
        `DELETE FROM community_album WHERE album_id = ?`,
        [albumId]
        );

        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};
//查询相册图片
export const getPhotosService = async (albumId) => {
    const sql = `
        SELECT *
        FROM community_photo
        WHERE album_id = ?
        AND status = 'normal'
        ORDER BY created_at DESC
    `;

    const [rows] = await db.execute(sql, [albumId]);
    return rows;
};
//创建相册分组
export const createAlbumService = async (data) => {
    const sql = `
        INSERT INTO community_album
        (community_id, album_name, event_id, creator_id)
        VALUES (?, ?, ?, ?)
    `;

    const [result] = await db.execute(sql, [
        data.community_id,
        data.album_name,
        data.event_id || null,
        data.creator_id
    ]);

    return result;
};
//获取所有相册
export const getAlbumListService = async (community_id) => {
    const sql = `
        SELECT 
        a.album_id,
        a.album_name,
        a.event_id,
        a.created_at,

        COUNT(p.photo_id) AS photo_count,

        -- 取最新一张作为封面
        MAX(p.image_url) AS cover_url

        FROM community_album a
        LEFT JOIN community_photo p 
        ON a.album_id = p.album_id 
        AND p.status = 'normal'

        WHERE a.community_id = ?
        GROUP BY a.album_id
        ORDER BY a.created_at DESC
    `;

    const [rows] = await db.execute(sql, [community_id]);
    return rows;
};