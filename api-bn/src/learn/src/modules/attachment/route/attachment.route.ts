import { Router } from 'express';
import { attachmentController } from '../controller/attachment.controller';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';

const uploadDisk = multer({
  storage: multer.diskStorage({
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const uuid = crypto.randomUUID();
      cb(null, `${uuid}${ext}`);
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

export const attachmentRoute = Router();

// Single upload
attachmentRoute.post('/upload', uploadDisk.single('file'), attachmentController.uploadSingle);

// Batch routes — distandardisasi
attachmentRoute.post('/batch/upload', uploadDisk.array('files'), attachmentController.uploadBulk);
attachmentRoute.post('/batch/get', attachmentController.getBatch);
attachmentRoute.post('/batch/delete', attachmentController.deleteBulk);

// Single delete
attachmentRoute.delete('/:id', attachmentController.deleteSingle);
attachmentRoute.get('/file/:url', attachmentController.serveFile);
