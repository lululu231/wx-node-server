import express from 'express'
import { createTopicController,
    getTopicListController,
    getTopicDetailController,
    
    } from '../controller/topicController.js'

const router = express.Router()

router.post('/create', createTopicController)
router.get('/list', getTopicListController)
router.get('/:topic_id',getTopicDetailController)

export default router