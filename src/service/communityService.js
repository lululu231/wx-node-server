import { db } from '../db/pool.js';

export const getAllCommunitiesWithRelation = async (userId, keyword = '') => {

  const sql = `
    SELECT 
      c.id,
      c.community_name,
      c.avatar_url,
      c.description,
      CASE 
        WHEN uc.status = 'joined' THEN 'joined'
        WHEN uc.status = 'pending' THEN 'pending'
        ELSE 'none'
      END AS relation
    FROM community c
    LEFT JOIN user_community uc 
      ON c.id = uc.community_id 
      AND uc.user_id = ?
    WHERE c.status = 'approved'
    AND (
      ? = '' 
      OR c.community_name LIKE CONCAT('%', ?, '%')
    )
  `;

  const [rows] = await db.query(sql, [userId, keyword, keyword]);

  return rows;
};
// 🔹 获取所有社团
export const getAllCommunitiesService = async () => {
  const [rows] = await db.query('SELECT id, community_name, avatar_url, description FROM community WHERE status = "approved"');
  return rows;
};
/**
 * 查询社团是否已存在
 * @param {string} community_name
 * @returns {Promise<boolean>}
 */
export const isCommunityExist = async (community_name) => {
  const sql = `SELECT id FROM community WHERE community_name = ? LIMIT 1`;
  const [rows] = await db.execute(sql, [community_name]);
  return rows.length > 0;
};

/**
 * 创建新社团
 * @param {object} communityData
 * @returns {Promise<number>} 插入的社团ID
 */
export const createCommunity = async (communityData) => {
  const { community_name, avatar_url, description, proofUrl, status, creator_id } = communityData;
  const sql = `
    INSERT INTO community
      (community_name, avatar_url, description, proof_url, status, creator_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const [result] = await db.execute(sql, [
    community_name,
    avatar_url || '',
    description || '',
    proofUrl,
    status || 'pending',
    creator_id
  ]);

  return result.insertId;
};
/**
 * 获取用户已加入的社团列表
 * @param {string} userId 用户ID
 * @returns {Promise<Array>} 社团列表
 */
export const getJoinedCommunities = async (userId) => {
  // 1️⃣ 获取 user_community 中 status='joined' 的社团ID
  const sql = `
    SELECT c.id, c.community_name, c.avatar_url, c.description
    FROM user_community uc
    JOIN community c ON uc.community_id = c.id
    WHERE uc.user_id = ? AND uc.status = 'joined'
    ORDER BY uc.join_time DESC
  `;
  
  try {
    const [rows] = await db.query(sql, [userId]);
    return rows; // 返回数组，每项是社团信息
  } catch (err) {
    console.error('获取已加入社团失败', err);
    throw err;
  }
};
/**
 * 用户加入社团
 */
export const joinCommunityService = async (user_id, community_id) => {

  try {
    await db.query(
      `INSERT INTO user_community 
        (community_id, user_id, status, join_time)
       VALUES (?, ?, 'pending', NOW())
       ON DUPLICATE KEY UPDATE 
         status = 'pending',
         join_time = NOW()`,
      [community_id, user_id]
    );

    return { code: 0, msg: '申请成功' };

  } catch (err) {
    console.error(err);
    return { code: 1, msg: '申请失败' };
  }
};