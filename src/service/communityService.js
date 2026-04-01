import { db } from '../db/pool.js';
// services/communityService.js

/**
 * 封禁社团
 * @param {number} communityId 社团ID
 */
export const banCommunityService = async (communityId) => {
  // 检查社团是否存在
  const [rows] = await db.query('SELECT id, ban_status FROM community WHERE id = ?', [communityId]);
  if (rows.length === 0) {
    throw new Error('社团不存在');
  }

  if (rows[0].ban_status === 'banned') {
    throw new Error('社团已被封禁');
  }

  // 更新 ban_status
  await db.query('UPDATE community SET ban_status = "banned" WHERE id = ?', [communityId]);

  return { communityId, ban_status: 'banned' };
};

/**
 * 解封社团
 * @param {number} communityId 社团ID
 */
export const unbanCommunityService = async (communityId) => {
  // 检查社团是否存在
  const [rows] = await db.query('SELECT id, ban_status FROM community WHERE id = ?', [communityId]);
  if (rows.length === 0) {
    throw new Error('社团不存在');
  }

  if (rows[0].ban_status !== 'banned') {
    throw new Error('社团未被封禁，无需解封');
  }

  // 更新 ban_status
  await db.query('UPDATE community SET ban_status = "normal" WHERE id = ?', [communityId]);

  return { communityId, ban_status: 'active' }; // active 表示正常
};

//管理端审核社团
// services/communityService.js

export const reviewCommunityService = async ({ communityId, status }) => {
  // 只允许 pending 的社团被审核
  const [rows] = await db.query(
    'SELECT status, creator_id FROM community WHERE id = ?',
    [communityId]
  );

  if (rows.length === 0) {
    throw new Error('社团不存在');
  }

  const community = rows[0];

  if (community.status !== 'pending') {
    throw new Error('该社团已审核，不能重复操作');
  }

  // 更新 status
  const sql = `
    UPDATE community
    SET status = ?
    WHERE id = ?
  `;
  await db.query(sql, [status, communityId]);

  // 方法 B：审核通过才认定社长
  if (status === 'approved') {
    // 将申请人成为社长，加入社团
    await db.query(
      `INSERT INTO user_community (community_id, user_id, status, join_time)
        VALUES (?, ?, 'joined', NOW())
        ON DUPLICATE KEY UPDATE status = 'joined', join_time = NOW()`,
      [communityId, community.creator_id]
    );
  }

  return {
    communityId,
    status
  };
};
/**
 * 🔥 多条件查询社团（推荐统一接口）
 */
export const queryCommunitiesService = async (params) => {
  const {
    userId,
    communityId,
    communityName,
    creatorId,
    status,
    relation,
    banStatus,
    page = 1,
    pageSize = 10
  } = params;

  let baseSql = `
    FROM community c
    LEFT JOIN user_community uc 
      ON c.id = uc.community_id
      ${userId ? 'AND uc.user_id = ?' : ''}
    WHERE 1=1
  `;

  const values = [];

  if (userId) values.push(userId);

  if (communityId) {
    baseSql += ` AND c.id = ?`;
    values.push(communityId);
  }

  if (communityName) {
    baseSql += ` AND c.community_name LIKE ?`;
    values.push(`%${communityName}%`);
  }

  if (creatorId) {
    baseSql += ` AND c.creator_id = ?`;
    values.push(creatorId);
  }

  if (status) {
    baseSql += ` AND c.status = ?`;
    values.push(status);
  }

  if (banStatus) {
    baseSql += ` AND c.ban_status = ?`;
    values.push(banStatus);
  }

  if (relation) {
    if (relation === 'none') {
      baseSql += ` AND uc.status IS NULL`;
    } else {
      baseSql += ` AND uc.status = ?`;
      values.push(relation);
    }
  }

  // ========================
  // ✅ 1️⃣ total
  // ========================
  const countSql = `SELECT COUNT(*) as total ${baseSql}`;
  const [[{ total }]] = await db.query(countSql, values);

  // ========================
  // ✅ 2️⃣ list
  // ========================
  const offset = (page - 1) * pageSize;

  const listSql = `
    SELECT 
      c.id,
      c.community_name,
      c.avatar_url,
      c.description,
      c.status,
      c.creator_id,
      c.ban_status,
      CASE 
        WHEN uc.status = 'joined' THEN 'joined'
        WHEN uc.status = 'pending' THEN 'pending'
        WHEN uc.status = 'reject' THEN 'reject'
        ELSE 'none'
      END AS relation
    ${baseSql}
    ORDER BY c.id DESC
    LIMIT ? OFFSET ?
  `;

  const listValues = [...values, pageSize, offset];

  const [list] = await db.query(listSql, listValues);

  return {
    list,
    total,
    page,
    pageSize
  };
};

/**
 * 获取所有社团（包含用户关系），排除 banned
 */
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
      AND (c.ban_status IS NULL OR c.ban_status != 'banned')
      AND (? = '' OR c.community_name LIKE CONCAT('%', ?, '%'))
  `;

  const [rows] = await db.query(sql, [userId, keyword, keyword]);
  return rows;
};

/**
 * 获取所有注册成功社团，排除 banned
 */
export const getAllCommunitiesService = async () => {
  const [rows] = await db.query(`
    SELECT id, community_name, avatar_url, description
    FROM community
    WHERE status = "approved"
      AND (ban_status IS NULL OR ban_status != 'banned')
  `);
  return rows;
};

/**
 * 获取所有待审核社团，排除 banned
 */
export const getPendingCommunitiesService = async () => {
  const [rows] = await db.query(`
    SELECT id, community_name, avatar_url, description
    FROM community
    WHERE status = "pending"
      AND (ban_status IS NULL OR ban_status != 'banned')
  `);
  return rows;
};

/**
 * 查询社团是否已存在，排除 banned
 */
export const isCommunityExist = async (community_name) => {
  const sql = `
    SELECT id 
    FROM community 
    WHERE community_name = ? 
      AND (ban_status IS NULL OR ban_status != 'banned')
    LIMIT 1
  `;
  const [rows] = await db.execute(sql, [community_name]);
  return rows.length > 0;
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
 * 用户加入社团（不允许加入 banned 社团）
 */
export const joinCommunityService = async (user_id, community_id) => {
  try {
    // 先检查社团是否被禁用
    const [rows] = await db.query(`
      SELECT id 
      FROM community 
      WHERE id = ? AND (ban_status IS NULL OR ban_status != 'banned')
    `, [community_id]);

    if (rows.length === 0) {
      return { code: 1, msg: '社团不存在或已被禁用' };
    }

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