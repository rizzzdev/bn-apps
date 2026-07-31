import { Router } from 'express';
import { attachmentController } from '../controller/attachment.controller';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
// Kita tidak menggunakan multer.diskStorage karena kita butuh buffer 
// agar logic nya mirip dengan getStorage().upload(filename, file)
// Namun, jika kita menggunakan memoryStorage, file besar akan memakan RAM.
// Untuk kompromi aman (dan sama seperti sebelumnya), kita gunakan diskStorage 
// dan kirim file.path ke getStorage().upload() yang akan copyFileSync.
// Atau bisa gunakan memoryStorage saja karena lebih sesuai dengan req.file.buffer yang diharapkan.
// Mari kita gunakan memoryStorage.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
    }
});
// Atau jika ingin menggunakan dest sementara:
const uploadDisk = multer({
    storage: multer.diskStorage({
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            const uuid = crypto.randomUUID();
            cb(null, `${uuid}${ext}`);
        }
    }),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
    }
});
export const attachmentRoute = Router();
attachmentRoute.post('/upload', uploadDisk.single('file'), attachmentController.uploadSingle);
attachmentRoute.post('/upload-bulk', uploadDisk.array('files'), attachmentController.uploadBulk);
attachmentRoute.delete('/:id', attachmentController.deleteSingle);
attachmentRoute.post('/delete-bulk', attachmentController.deleteBulk);
attachmentRoute.post('/batch', attachmentController.getBatch);
attachmentRoute.get('/file/:url', attachmentController.serveFile);
