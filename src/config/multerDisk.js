import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mimeToExt = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif'
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.resolve('uploads')
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },

  filename: function (req, file, cb) {
  const extFromName = path.extname(file.originalname)

  console.log('originalname:', file.originalname)
  console.log('extFromName:', extFromName)
  console.log('mimetype:', file.mimetype)

  const ext =
    extFromName ||
    mimeToExt[file.mimetype] ||
    '.jpg'

  const filename =
    Date.now() +
    '_' +
    Math.round(Math.random() * 1e9) +
    ext

  console.log('final filename:', filename)

  cb(null, filename)
  }
})
export const upload = multer({ storage });
