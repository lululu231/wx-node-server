import express from 'express';
import { applyCommunity } from '../controller/communityController.js';
import 
    { 
        getJoinedCommunitiesController,
        joinCommunity,getAllCommunities,
        getAllCommunitiesWithRelationController,
        getPendingCommunities,
        queryCommunitiesController,
        reviewCommunity,
        banCommunity,
        unbanCommunity
    } from '../controller/communityController.js';

const router = express.Router();

// 获取用户已加入社团
router.get('/joined', getJoinedCommunitiesController);
//获取全部审核成功社团信息
router.get('/all', getAllCommunities);
//获取全部pending社团
router.get('/pending',getPendingCommunities)
// 创建社团接口
router.post('/apply', applyCommunity);
//申请加入社团
router.post('/join', joinCommunity);
//社团-用户关系
router.get('/allWithRelation', getAllCommunitiesWithRelationController);
//按条件查社团
router.get('/query', queryCommunitiesController); 
//社团审核
router.patch('/review', reviewCommunity);
//解封/封禁社团
router.post('/ban', banCommunity);
router.post('/unban', unbanCommunity)
export default router;