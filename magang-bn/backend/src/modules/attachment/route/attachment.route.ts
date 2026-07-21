import { Router } from 'express';
import { validate } from '@/middlewares/index.js';

import multer from 'multer';
import fs from 'fs';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.resolve(process.cwd(), 'public/attachments');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop() || '';
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = `${Date.now()}-${randomStr}.${ext}`;
    cb(null, filename);
  }
});
const upload = multer({ storage });

import { attachmentController } from '@/modules/attachment/controller/index.js';
import { createAttachmentSchema, updateAttachmentSchema } from '@/modules/attachment/domain/index.js';

export const attachmentRoute = Router();

attachmentRoute.get('/', attachmentController.getAll);
attachmentRoute.get('/:id', attachmentController.getById);
attachmentRoute.post('/', upload.single('file'), attachmentController.uploadFile);
// attachmentRoute.post('/', validate(createAttachmentSchema), attachmentController.create);
attachmentRoute.put('/:id', validate(updateAttachmentSchema), attachmentController.update);
attachmentRoute.post('/bulk-delete', attachmentController.bulkDelete);
attachmentRoute.delete('/:id', attachmentController.delete);
