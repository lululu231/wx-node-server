import { db } from '../db/pool.js';
import { redisClient } from '../db/redisClient.js';
import { config } from '../config/index.js';

const getAvatarCacheKey = (user_id) => `user:avatar:${user_id}`;
//获取头像
export const getAvatarService = async (user_id) => {
    const cacheKey = getAvatarCacheKey(user_id);

    // 1️⃣ 查缓存
    try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (err) {
        console.warn('Redis get failed', err);
    }

    // 2️⃣ 查数据库
    const [rows] = await db.execute(
        `SELECT nick_name, user_id, avatar_url, student_id, gender, phone_number 
         FROM user 
         WHERE user_id = ?`,
        [user_id]
    );

    if (rows.length === 0) {
        return null;
    }

    const user = rows[0];

    // 3️⃣ 写缓存
    try {
        await redisClient.set(cacheKey, JSON.stringify(user), {
            EX: config.redis.defaultTTL,
        });
    } catch (err) {
        console.warn('Redis set failed', err);
    }

    return user;
};
// 更新用户信息
export const updateUserService = async (user) => {
    if (!user.user_id) {
        throw new Error('user_id 不能为空');
    }

    const {
        user_id,
        nick_name,
        avatar_url,
        student_id,
        gender,
        phone_number
    } = user;

    const cacheKey = getAvatarCacheKey(user_id); // ✅ 修复

    // 1️⃣ 更新数据库
    const [result] = await db.execute(
        `
        UPDATE user
        SET 
            nick_name = ?,
            avatar_url = ?,
            student_id = ?,
            gender = ?,
            phone_number = ?
        WHERE user_id = ?
        `,
        [nick_name, avatar_url, student_id, gender, phone_number, user_id]
    );

    if (result.affectedRows === 0) {
        return null;
    }

    // 2️⃣ 删除缓存
    try {
        await redisClient.del(cacheKey);
    } catch (err) {
        console.warn('Redis del failed', err);
    }

    return { success: true };
};