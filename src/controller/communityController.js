import { isCommunityExist, createCommunity } from '../service/communityService.js';
// src/controller/communityController.js
import { getJoinedCommunities } from '../service/communityService.js';
// controller/communityController.js
import { getAllCommunitiesService } from '../service/communityService.js';

import { joinCommunityService } from '../service/communityService.js';
import { getAllCommunitiesWithRelation } from '../service/communityService.js';

/**
 * 获取社团 + 用户关系状态
 * GET /community/allWithRelation?userId=xxx
 */
export const getAllCommunitiesWithRelationController = async (req, res) => {
  try {
    const { userId, keyword = '' } = req.query;

    const data = await getAllCommunitiesWithRelation(userId, keyword);

    res.json({
      code: 0,
      data
    });

  } catch (err) {
    res.json({
      code: 1,
      msg: '查询失败'
    });
  }
};
/**
 * 用户加入社团
 * POST /community/join
 */
export const joinCommunity = async (req, res) => {
  const { user_id, community_id } = req.body;

  // 1️⃣ 参数校验
  if (!user_id || !community_id) {
    return res.json({ code: 1, msg: '参数缺失' });
  }

  try {
    const result = await joinCommunityService(user_id, community_id);

    res.json(result);

  } catch (err) {
    console.error('joinCommunity error:', err);
    res.json({
      code: 1,
      msg: '服务器错误'
    });
  }
};
export const getAllCommunities = async (req, res) => {
  try {
    const communities = await getAllCommunitiesService();
    res.json({
      code: 0,
      data: communities
    });
  } catch (err) {
    console.error(err);
    res.json({
      code: 1,
      msg: '获取社团失败'
    });
  }
};
/**
 * 获取当前用户已加入社团
 * GET /communities/joined?userId=xxx
 */
export const getJoinedCommunitiesController = async (req, res) => {
  const { userId } = req.query; // 或者从 token 中解析 userId
    //console.log('userId',userId)
  if (!userId) {
    return res.status(400).json({ code: 1, msg: 'userId 缺失' });
  }

  try {
    const communities = await getJoinedCommunities(userId);
    //console.log('communities',communities)
    res.json({ code: 0, msg: 'success', data: communities });
  } catch (err) {
    res.status(500).json({ code: 2, msg: '获取已加入社团失败' });
  }
};
/**
 * 申请创建社团
 */
export const applyCommunity = async (req, res) => {
  const { community_name, avatar_url, description, proofUrl, status, creator_id } = req.body;

  // ✅ 1. 基础参数校验
  if (!community_name || !proofUrl) {
    return res.json({ code: 1, msg: '社团名称或证明不能为空' });
  }

  try {
    // ✅ 2. 判断社团是否已存在
    const exist = await isCommunityExist(community_name);
    if (exist) {
      return res.json({ code: 1, msg: '该社团已存在，不能重复创建' });
    }

    // ✅ 3. 创建社团
    const id = await createCommunity({ community_name, avatar_url, description, proofUrl, status, creator_id });

    // ✅ 4. 返回统一格式
    res.json({ code: 0, msg: 'success', data: { id } });

  } catch (err) {
    // 唯一索引冲突
    if (err.code === 'ER_DUP_ENTRY') {
      return res.json({ code: 1, msg: '该社团已存在（数据库唯一约束）' });
    }

    console.error(err);
    res.json({ code: 1, msg: '数据库异常' });
  }
};