// services/communityDepartmentService.js
import { db } from '../db/pool.js';

/**
 * 解散部门
 */
export const dissolveDepartmentService = async (departmentId) => {
  const conn = await db.getConnection(); // 🔥 开启连接（用于事务）

  try {
    await conn.beginTransaction();

    // 1️⃣ 校验部门是否存在
    const [rows] = await conn.query(
      'SELECT department_id, status FROM community_department WHERE department_id = ?',
      [departmentId]
    );

    if (rows.length === 0) {
      throw new Error('部门不存在');
    }

    if (rows[0].status === 0) {
      throw new Error('该部门已解散');
    }

    // 2️⃣ 更新部门状态（逻辑删除）
    await conn.query(
      'UPDATE community_department SET status = 0 WHERE department_id = ?',
      [departmentId]
    );

    // 3️⃣ 清理成员部门 + 降级职位
    await conn.query(
      `
      UPDATE user_department_position
      SET 
        department_id = NULL,
        position = '普通成员'
      WHERE department_id = ?
      `,
      [departmentId]
    );

    await conn.commit();

    return true;

  } catch (err) {
    await conn.rollback(); // ❗回滚
    throw err;
  } finally {
    conn.release(); // 释放连接
  }
};
/**
 * 更新部门信息
 * @param {number} departmentId
 * @param {object} data
 */
export const updateDepartmentService = async (departmentId, data) => {
    const { department_name, admin_id } = data;

    // 1️⃣ 校验部门是否存在
    const [rows] = await db.query(
      'SELECT department_id FROM community_department WHERE department_id = ?',
      [departmentId]
    );

    if (rows.length === 0) {
      throw new Error('部门不存在');
    }

    // 2️⃣ 构建动态 SQL（可扩展）
    const fields = [];
    const values = [];

    if (department_name !== undefined) {
      fields.push('department_name = ?');
      values.push(department_name);
    }

    if (admin_id !== undefined) {
      fields.push('admin_id = ?');
      values.push(admin_id);
    }

    // ❗防止空更新
    if (fields.length === 0) {
      throw new Error('没有可更新的字段');
    }

    const sql = `
      UPDATE community_department
      SET ${fields.join(', ')}
      WHERE department_id = ?
    `;

    values.push(departmentId);

    await db.query(sql, values);

    return true;
};
/**
 * 获取指定社团的全部部门
 * @param {number} communityId - 社团ID
 * @returns {Promise<Array>} 部门列表
 */
export const getDepartmentsByCommunity = async (communityId) => {
  const sql = `
    SELECT 
      d.department_id,
      d.community_id,
      d.department_name,
      d.status,
      d.admin_id,
      u.nick_name AS admin_name
    FROM community_department d
    LEFT JOIN user u 
      ON d.admin_id = u.user_id
    WHERE d.community_id = ?
  `;

  const [rows] = await db.query(sql, [communityId]);
  return rows;
};
/**
 * 创建社团部门
 * @param {Object} param0
 * @param {string} param0.department_name
 * @param {number} param0.community_id
 * @param {string|null} param0.admin_id
 * @returns 新增部门信息
 */
export const createDepartment = async ({ department_name, community_id, admin_id }) => {
  // 插入部门，admin_id 可以为空
  const [result] = await db.query(
    'INSERT INTO community_department (community_id, department_name, admin_id) VALUES (?, ?, ?)',
    [community_id, department_name, admin_id || null]
  );

  const department_id = result.insertId; // ✅ 取到刚插入的自增 ID

  // 如果有 admin_id，插入 user_department_position
  if (admin_id) {
    await db.query(
      `INSERT INTO user_department_position 
       (community_id, user_id, department_id, position)
       VALUES (?, ?, ?, ?)`,
      [community_id, admin_id, department_id, '部长']
    );
  }

  return {
    department_id,
    community_id,
    department_name,
    admin_id: admin_id || null
  };
};
