// controller/communityController.js
import { getAllCommunitiesService ,getPendingCommunitiesService} from '../service/communityService.js';

import { getAllCommunitiesWithRelation } from '../service/communityService.js';
import {
  queryCommunitiesService,
  getJoinedCommunities,
  joinCommunityService,
  isCommunityExist,
  createCommunity,
  reviewCommunityService,
  banCommunityService,
  unbanCommunityService
} from '../service/communityService.js';

// controllers/communityController.js

// 封禁社团
export const banCommunity = async (req, res) => {
  try {
    const { communityId } = req.body;
    if (!communityId) return res.status(400).json({ message: 'communityId 必传' });

    const result = await banCommunityService(communityId);
    res.json({ message: '社团已封禁', data: result });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || '服务器错误' });
  }
};

// 解封社团
export const unbanCommunity = async (req, res) => {
  try {
    const { communityId } = req.body;
    if (!communityId) return res.status(400).json({ message: 'communityId 必传' });

    const result = await unbanCommunityService(communityId);
    res.json({ message: '社团已解封', data: result });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || '服务器错误' });
  }
};
// 审核社团（简化版，仅更新 status）
export const reviewCommunity = async (req, res) => {
  try {
    const { communityId, status } = req.body;

    // 参数校验
    if (!communityId || !status) {
      return res.status(400).json({
        message: 'communityId 和 status 必传'
      });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        message: 'status 非法'
      });
    }

    // 调用 service，仅传 communityId 和 status
    const result = await reviewCommunityService({ communityId, status });

    res.json({
      message: '审核成功',
      data: result
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err.message || '服务器错误'
    });
  }
};
/**
 * 🔥 统一查询社团接口（核心）
 * GET /community/query
 */
export const queryCommunitiesController = async (req, res) => {
  try {
    let {
      userId,
      communityId,
      communityName,
      creatorId,
      status,
      relation,
      banStatus,
      page = 1,          // ✅ 新增
      pageSize = 10      // ✅ 新增
    } = req.query;

    // ✅ 类型处理
    userId = userId ? Number(userId) : undefined;
    communityId = communityId ? Number(communityId) : undefined;
    creatorId = creatorId ? Number(creatorId) : undefined;

    page = Number(page);
    pageSize = Number(pageSize);

    // ✅ 防御（避免被人恶意传超大 pageSize）
    if (page <= 0) page = 1;
    if (pageSize <= 0 || pageSize > 50) pageSize = 10;

    const result = await queryCommunitiesService({
      userId,
      communityId,
      communityName,
      creatorId,
      status,
      relation,
      banStatus,
      page,
      pageSize
    });
    //console.log('result',result)
    res.json({
      code: 0,
      ...result   // ✅ { list, total }
    });

  } catch (err) {
    console.error('queryCommunities error:', err);
    res.json({
      code: 1,
      msg: '查询失败'
    });
  }
};
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
//获取全部approved社团
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
//获取全部pending社团
export const getPendingCommunities = async(req,res)=>{
  try{
    const communities=await getPendingCommunitiesService()
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
}
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