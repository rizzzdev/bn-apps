import multer, { memoryStorage } from 'multer';
import path from 'path';
import fs from 'fs';

// -- Excel upload --
// Definisi ada di `#app/middlewares/upload-excel.middleware.js` (single source of truth).
// PENTING: re-export LANGSUNG dari file (bukan barrel `#app`) — barrel `#app` ikut
// memuat routes yang memuat modul ini lagi, sehingga re-export lewat barrel
// memicu circular dependency ("Cannot access 'uploadExcel' before initialization").
export { uploadExcel } from '#app/middlewares/upload-excel.middleware.js';

// -- Attachment upload (new) --
const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const attachmentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, publicDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = `${Date.now()}-${randomStr}${ext}`;
    cb(null, filename);
  },
});

const attachmentUpload = multer({
  storage: attachmentStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadAttachment = attachmentUpload.single('file');
export const uploadAttachments = attachmentUpload.array('files', 20);
