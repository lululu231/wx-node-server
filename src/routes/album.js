
import express from 'express';
import {getAlbumList,
    createAlbum,
    getPhotos,
    deleteAlbum,
    deletePhoto,
    uploadPhoto
} from '../controller/albumController.js'
import { upload } from '../config/multerDisk.js';
const router = express.Router();
//创建相册分组
router.post('/album/create', createAlbum)
//全部相册
router.get('/album/list',getAlbumList)
router.get('/album/:albumId/photos', getPhotos)
router.delete('/album/:albumId', deleteAlbum)
router.delete('/photo/:photoId', deletePhoto)
// router.post('/photo/upload', uploadPhoto)
router.post(
    '/photo/upload',
    upload.single('file'), // 👈 关键：解析 multipart/form-data
    uploadPhoto
);
export default router;