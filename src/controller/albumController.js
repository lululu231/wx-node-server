import {uploadPhotoService,
    deletePhotoService,
    deleteAlbumService,
    getPhotosService,
    createAlbumService,
    getAlbumListService
} from '../service/albumService.js'
//获取全部相册
export const getAlbumList = async (req, res) => {
    const { community_id } = req.query;

    if (!community_id) {
        return res.send({ code: 1, message: '缺少 community_id' });
    }

    try {
        const data = await getAlbumListService(community_id);

        res.send({
        code: 0,
        data
        });
    } catch (err) {
        res.send({
        code: 1,
        message: err.message
        });
    }
};
//查询相册图片
export const getPhotos = async (req, res) => {
    const { albumId } = req.params;

    try {
        const data = await getPhotosService(albumId);

        res.send({
        code: 0,
        data
        });
    } catch (err) {
        res.send({ code: 1, message: err.message });
    }
};
//删除分组
export const deleteAlbum = async (req, res) => {
    const { albumId } = req.params;

    try {
        await deleteAlbumService(albumId);

        res.send({
        code: 0,
        message: '删除成功'
        });
    } catch (err) {
        res.send({ code: 1, message: err.message });
    }
};
//删除图片
export const deletePhoto = async (req, res) => {
    const { photoId } = req.params;

    try {
        await deletePhotoService(photoId);

        res.send({
        code: 0,
        message: '删除成功'
        });
    } catch (err) {
        res.send({ code: 1, message: err.message });
    }
};
//上传图片
export const uploadPhoto = async (req, res) => {
    const { album_id, community_id, uploader_id } = req.body;
        console.log('req.file',req.file)
    
    if (!req.file) {
        return res.send({ code: 1, message: '未上传图片' });
    }

    try {
        const image_url = `/uploads/${req.file.filename}`;

        const result = await uploadPhotoService({
        album_id,
        community_id,
        uploader_id,
        image_url
        });

        res.send({
        code: 0,
        message: '上传成功',
        data: { photo_id: result.insertId, image_url }
        });
    } catch (err) {
        res.send({ code: 1, message: err.message });
    }
};
//创建相册分组
export const createAlbum = async (req, res) => {
    const { community_id, album_name, event_id, creator_id } = req.body;

    if (!community_id || !album_name || !creator_id) {
        return res.send({ code: 1, message: '参数不完整' });
    }

    try {
        const result = await createAlbumService({
        community_id,
        album_name,
        event_id,
        creator_id
        });

        res.send({
        code: 0,
        message: '创建成功',
        data: { album_id: result.insertId }
        });
    } catch (err) {
        res.send({ code: 1, message: err.message });
    }
};