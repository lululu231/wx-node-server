// controllers/communityDepartmentController.js
import { 
        createDepartment , 
        getDepartmentsByCommunity ,
        updateDepartmentService,
        dissolveDepartmentService
    } from '../service/departmentService.js';
// controller/communityDepartmentController.js


export const dissolveDepartment = async (req, res) => {
    try {
    const { departmentId } = req.params;

    if (!departmentId) {
        return res.status(400).json({
        code: 1,
        msg: 'departmentId 必传'
        });
    }

    await dissolveDepartmentService(departmentId);

    return res.json({
        code: 0,
        msg: '部门已解散'
    });

    } catch (err) {
    console.error('解散部门失败:', err);

    return res.status(500).json({
        code: 1,
        msg: err.message || '解散失败'
    });
    }
};
/**
 * 更新部门
 */
export const updateDepartment = async (req, res) => {
    try {
    const { departmentId } = req.params;
    const { department_name, admin_id } = req.body;

    if (!departmentId) {
        return res.status(400).json({
        code: 1,
        msg: 'departmentId 必传'
        });
    }

    await updateDepartmentService(departmentId, {
        department_name,
        admin_id
    });

    return res.json({
        code: 0,
        msg: '更新成功'
    });

    } catch (err) {
    console.error('更新部门失败:', err);

    return res.status(500).json({
        code: 1,
        msg: err.message || '更新失败'
    });
    }
};
/**
 * 查询社团全部部门接口
 * GET /departments/:communityId
 */
export const queryDepartments = async (req, res) => {
    try {
    const { communityId } = req.params;

    if (!communityId) {
        return res.status(400).json({ code: 400, message: 'communityId 必传' });
    }

    const departments = await getDepartmentsByCommunity(communityId);

    return res.json({
        code: 0,
        message: '查询成功',
        data: departments
    });
    } catch (err) {
    console.error('查询部门失败:', err);
    return res.status(500).json({
        code: 500,
        message: '查询部门失败'
    });
    }
};
// controllers/communityDepartmentController.js
export const createDepartmentController = async (req, res) => {
    try {
    const { department_name, community_id, admin_id } = req.body;

    if (!department_name || !community_id) {
        return res.status(400).json({
        code: 1,
        data: null,
        message: '缺少必要参数'
        });
    }

    const department = await createDepartment({ department_name, community_id, admin_id });

    res.status(201).json({
        code: 0,
        data: department,
        message: '部门创建成功'
    });
    } catch (error) {
    console.error(error);
    res.status(500).json({
        code: 1,
        data: null,
        message: error.message || '创建部门失败'
    });
    }
};