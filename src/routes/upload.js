import express from 'express';
import { upload } from '../config/multerDisk.js';

const router = express.Router();

// 文件上传接口（小程序 wx.uploadFile 使用）
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 1, msg: 'No file uploaded' });
    }

    // ✅ 只返回路径
    const filePath = `/uploads/${req.file.filename}`

    res.json({
      code: 0,
      msg: '上传成功',
      url: filePath
    });

  } catch (err) {
    console.error('上传错误:', err);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});
export default router;
