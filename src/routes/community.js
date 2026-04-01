import express from 'express';
import { applyCommunity } from '../controller/communityController.js';
import { getJoinedCommunitiesController,joinCommunity,getAllCommunities,getAllCommunitiesWithRelationController} from '../controller/communityController.js';

const router = express.Router();

// 获取用户已加入社团
router.get('/joined', getJoinedCommunitiesController);
//获取全部社团信息
router.get('/all', getAllCommunities);
// 创建社团接口
router.post('/apply', applyCommunity);
//申请加入社团
router.post('/join', joinCommunity);
//社团-用户关系
router.get('/allWithRelation', getAllCommunitiesWithRelationController);
export default router;