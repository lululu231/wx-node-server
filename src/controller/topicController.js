import { createTopicService,
        getTopicListService,
        getTopicByIdService,
        } from '../service/topicService.js'

export const getTopicDetailController = async (req, res) => {
    try {
        const { topic_id } = req.params

        if (!topic_id) {
        return res.status(400).json({
            code: 400,
            message: 'topic_id不能为空'
        })
        }

        const data = await getTopicByIdService(topic_id)

        if (!data) {
        return res.status(404).json({
            code: 404,
            message: '帖子不存在'
        })
        }

        res.json({
        code: 0,
        message: '查询成功',
        data
        })

    } catch (error) {
        console.error('查询帖子详情失败:', error)

        res.status(500).json({
        code: 500,
        message: '服务器错误'
        })
    }
}
export const getTopicListController = async (req, res) => {
    try {
        const { community_id = 0 } = req.query

        const list = await getTopicListService(community_id)

        res.json({
        code: 0,
        message: '查询成功',
        data: list
        })

    } catch (error) {
        console.error('查询帖子失败:', error)

        res.status(500).json({
        code: 500,
        message: '服务器错误'
        })
    }
}
export const createTopicController = async (req, res) => {
    try {
        const { 
        community_id, 
        user_id, 
        title, 
        content,
        image_urls = [] // ✅ 新增
        } = req.body

        if (!community_id || !user_id || !title || !content) {
        return res.status(400).json({
            code: 400,
            message: '参数不完整'
        })
        }

        const topicId = await createTopicService({
        community_id,
        user_id,
        title,
        content,
        image_urls
        })

        res.json({
        code: 0,
        message: '发布成功',
        data: {
            topic_id: topicId
        }
        })

    } catch (error) {
        console.error('发布帖子失败:', error)

        res.status(500).json({
        code: 500,
        message: '服务器错误'
        })
    }
}