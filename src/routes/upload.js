import express from 'express';
import { upload } from '../config/multerDisk.js';

const router = express.Router();

// 文件上传接口（小程序 wx.uploadFile 使用）
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 1, msg: 'No file uploaded' });
    }

    const fileUrl = `http://localhost:3000/uploads/${req.file.filename}`;

    console.log('fileUrl:', fileUrl);

    res.json({
      code: 0,
      msg: '上传成功',
      url: fileUrl
    });

  } catch (err) {
    console.error('上传错误:', err);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});
export default router;
