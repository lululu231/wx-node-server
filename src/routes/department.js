import express from 'express';
import { 
    createDepartmentController,
    queryDepartments,
    updateDepartment,
    dissolveDepartment
    } from "../controller/departmentController.js"
const router = express.Router();
///department/create
router.post('/create', createDepartmentController);
// 查询指定社团全部部门
router.get('/:communityId', queryDepartments);
//更新部门信息
router.put('/update/:departmentId', updateDepartment);
// 解散部门
router.put('/dissolve/:departmentId', dissolveDepartment);
export default router;