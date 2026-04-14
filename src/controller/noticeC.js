import {
    createNoticeService,
    updateNoticeService,
    getNoticeListService
} from '../service/noticeS.js';


export const getNoticeListController = async (req, res) => {
    try {
        const { community_id, type, page, pageSize } = req.query;

        if (!community_id) {
        return res.send({
            code: 400,
            message: '缺少 community_id'
        });
        }

        const list = await getNoticeListService({
        community_id,
        type,
        page: Number(page) || 1,
        pageSize: Number(pageSize) || 10
        });

        res.send({
        code: 0,
        message: '获取成功',
        data: list
        });

    } catch (err) {
        console.error('查询公告失败：', err);

        res.send({
        code: 500,
        message: '服务器错误'
        });
    }
};
/**
 * 创建公告
 */
export const createNoticeController = async (req, res) => {
    try {
        const {
        title,
        content,
        type = 'normal',
        attachment,
        creator_id,
        community_id   // ✅ 新增
        } = req.body;

        // ✅ 参数校验
        if (!title || !content || !creator_id || !community_id) {
        return res.send({
            code: 400,
            message: '缺少必要参数'
        });
        }

        const result = await createNoticeService({
        title,
        content,
        type,
        attachment,
        creator_id,
        community_id   // ✅ 传下去
        });

        res.send({
        code: 0,
        message: '创建成功',
        data: result
        });

    } catch (err) {
        console.error(err);
        res.send({
        code: 500,
        message: '创建公告失败'
        });
    }
};

/**
 * 修改公告
 */
export const updateNoticeController = async (req, res) => {
    try {
        const {
        id,
        title,
        content,
        type,
        attachment
        } = req.body;

        if (!id) {
        return res.send({
            code: 400,
            message: '缺少公告ID'
        });
        }

        const result = await updateNoticeService({
        id,
        title,
        content,
        type,
        attachment
        });

        res.send({
        code: 0,
        message: '修改成功',
        data: result
        });

    } catch (err) {
        console.error(err);
        res.send({
        code: 500,
        message: '修改公告失败'
        });
    }
};