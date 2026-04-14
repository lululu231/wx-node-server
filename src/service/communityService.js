import { db } from '../db/pool.js';
// 获取待审核用户列表
export const getPendingUsersByCommunityId = async (communityId, status) => {
    if (!communityId) throw new Error('communityId 不能为空')

    let sql = `
        SELECT 
            uc.*,
            u.nick_name,
            u.avatar_url,
            u.phone_number,
            u.gender
        FROM user_community uc
        LEFT JOIN user u 
            ON uc.user_id = u.user_id
        WHERE uc.community_id = ?
    `

    const params = [communityId]

    // 👇 关键：动态 status 条件
    if (status && status !== 'all') {
        sql += ` AND uc.status = ?`
        params.push(status)
    }

    sql += ` ORDER BY uc.join_time DESC`

    const [rows] = await db.execute(sql, params)
    return rows
}

export const approveUserJoin = async (communityId, userId, action) => {
    if (!communityId || !userId) {
        throw new Error('communityId 或 userId 不能为空')
    }

    // 白名单映射
    const statusMap = {
        approve: 'joined',
        reject: 'reject'
    }

    const targetStatus = statusMap[action]

    if (!targetStatus) {
        throw new Error('非法审核操作')
    }

    const sql = `
        UPDATE user_community
        SET status = ?
        WHERE community_id = ?
            AND user_id = ?
            AND status = 'pending'
    `

    const [result] = await db.execute(sql, [
        targetStatus,
        communityId,
        userId
    ])
    console.log('communityId:', communityId)
    console.log('userId:', userId)
    console.log('action:', action)
    console.log('result:', result)
    // ======================
    // ⭐ 核心：更新结果校验
    // ======================
    if (result.affectedRows === 0) {
        throw new Error(`审核失败：当前状态为 ${targetStatus}`)
    }

    return true
}
/**
 * 删除社团成员记录
 * @param {number} communityId 
 * @param {string} userId 
 */
export const kickMemberService = async (communityId, userId) => {
  // 可以先检查用户是否在社团内（可选）
  const deletedRows = await removeUserFromCommunity(communityId, userId);
  if (deletedRows === 0) {
    throw new Error('成员不存在或已被移除');
  }
  return true;
};
export const removeUserFromCommunity = async (communityId, userId) => {
  const sql = `DELETE FROM user_community WHERE community_id = ? AND user_id = ?`;
  const [result] = await db.query(sql, [communityId, userId]);
  return result.affectedRows; // 返回删除的行数
};
/**
 * 普通成员更换部门逻辑
 * @param {Object} params
 * @param {number} params.communityId
 * @param {number} params.targetUserId
 * @param {number} params.departmentId
 * @param {number} params.currentUserId
 */
export const changeMemberDepartmentService = async ({
    communityId,
    targetUserId,
    operatorUserId, // 谁操作的
    departmentId
  }) => {
    // 1️⃣ 查询操作者在社团的职位
    const [opRows] = await db.query(
      `SELECT position FROM user_department_position 
      WHERE community_id = ? AND user_id = ?`,
      [communityId, operatorUserId]
    );

    if (!opRows.length) {
      throw new Error('操作者未加入社团');
    }

    const operatorPosition = opRows[0].position;

    // 只有社长或部长能调部门
    if (operatorPosition !== '社长' && operatorPosition !== '部长') {
      throw new Error('没有权限更换他人部门');
    }

    // 2️⃣ 查询目标用户
    const [targetRows] = await db.query(
      `SELECT position FROM user_department_position 
      WHERE community_id = ? AND user_id = ?`,
      [communityId, targetUserId]
    );

    if (!targetRows.length) {
      throw new Error('目标用户未加入社团');
    }

    const targetPosition = targetRows[0].position;

    // 只能调普通成员
    if (targetPosition !== '普通成员') {
      throw new Error('只能更换普通成员的部门');
    }

    // 3️⃣ 检查目标部门是否存在
    const [deptRows] = await db.query(
      `SELECT * FROM community_department 
      WHERE department_id = ? AND community_id = ?`,
      [departmentId, communityId]
    );

    if (!deptRows.length) {
      throw new Error('目标部门不存在');
    }

    // 4️⃣ 执行更新
    await db.query(
      `UPDATE user_department_position 
      SET department_id = ? 
      WHERE community_id = ? AND user_id = ?`,
      [departmentId, communityId, targetUserId]
    );

  return true;
};
/**
 * 查询社团成员（支持按部门筛选）
 * @param {number|string} communityId 社团ID
 * @param {number|string|null} departmentId 部门ID（可选）
 * @returns {Promise}
 */
export const getCommunityMembersService = (communityId, departmentId = null) => {
  let sql = `
    SELECT 
      u.user_id,
      u.nick_name,
      u.avatar_url,
      u.student_id,
      u.gender,
      u.phone_number,
      d.department_id,
      d.department_name,
      udp.position
    FROM user_community uc
    INNER JOIN user u ON uc.user_id = u.user_id
    LEFT JOIN user_department_position udp 
      ON uc.community_id = udp.community_id AND uc.user_id = udp.user_id
    LEFT JOIN community_department d 
      ON udp.department_id = d.department_id
    WHERE uc.community_id = ?
      AND uc.status = 'joined'
  `;

  const params = [communityId];

  // ✅ 动态加筛选条件
  if (departmentId) {
    sql += ` AND udp.department_id = ?`;
    params.push(departmentId);
  }

  return db.query(sql, params)
    .then(([rows]) => rows)
    .catch(err => {
      console.error('查询社团成员失败:', err);
      throw err;
    });
};
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
  const conn = await db.getConnection(); // ① 获取连接（事务必须用同一个连接）

  try {
    await conn.beginTransaction(); // ② 开启事务

    // ③ 查询社团信息
    const [rows] = await conn.query(
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

    // ④ 更新状态
    await conn.query(
      `UPDATE community SET status = ? WHERE id = ?`,
      [status, communityId]
    );

    // ===============================
    // ✅ 审核通过后的核心逻辑
    // ===============================
    if (status === 'approved') {
      const creatorId = community.creator_id;

      // ⑤ 加入社团
      await conn.query(
        `INSERT INTO user_community (community_id, user_id, status, join_time)
          VALUES (?, ?, 'joined', NOW())
          ON DUPLICATE KEY UPDATE status = 'joined', join_time = NOW()`,
        [communityId, creatorId]
      );

      // ⑥ 设置为社长
      await conn.query(
        `INSERT INTO user_department_position
          (user_id, community_id, department_id, position)
          VALUES (?, ?, NULL, ?)
          ON DUPLICATE KEY UPDATE position = ?`,
        [creatorId, communityId, '社长', '社长']
      );
    }

    await conn.commit(); // ✅ ⑦ 提交事务（全部成功才生效）

    return {
      communityId,
      status
    };

  } catch (err) {
    await conn.rollback(); // ❌ ⑧ 任何错误 → 回滚（全部撤销）
    throw err;

  } finally {
    conn.release(); // ⑨ 释放连接（必须写）
  }
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