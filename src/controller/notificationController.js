import {
    getNotificationListService,
    markAsReadService,
    getUnreadCountService
} from '../service/notificationService.js';

// ======================
// 列表
// ======================
export const getNotificationList = async (req, res) => {
    try {
        const { userId, category, page, pageSize } = req.query;

        const list = await getNotificationListService({
        userId,
        category,
        page,
        pageSize
        });

        res.send({
        code: 0,
        data: list
        });

    } catch (err) {
        res.send({
        code: 1,
        message: err.message
        });
    }
};

// ======================
// 已读
// ======================
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.body;

        await markAsReadService(id);

        res.send({
        code: 0,
        message: '已读成功'
        });

    } catch (err) {
        res.send({
        code: 1,
        message: err.message
        });
    }
};

// ======================
// 未读数量
// ======================
export const getUnreadCount = async (req, res) => {
    try {
        const { userId } = req.query;

        const count = await getUnreadCountService(userId);

        res.send({
        code: 0,
        data: count
        });

    } catch (err) {
        res.send({
        code: 1,
        message: err.message
        });
    }
};