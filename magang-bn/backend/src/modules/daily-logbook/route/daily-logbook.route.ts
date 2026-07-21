import { Router } from 'express';
import { validate } from '@/middlewares/index.js';
import { dailyLogbookController } from '@/modules/daily-logbook/controller/index.js';
import { createDailyLogbookSchema, updateDailyLogbookSchema, bulkDeleteSchema, createLogbookReviewSchema } from '@/modules/daily-logbook/domain/index.js';

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

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

export const dailyLogbookRoute = Router();

dailyLogbookRoute.get('/', dailyLogbookController.getAll);
dailyLogbookRoute.get('/:id', dailyLogbookController.getById);
dailyLogbookRoute.post('/', upload.array('attachments'), validate(createDailyLogbookSchema), dailyLogbookController.create);
dailyLogbookRoute.put('/:id', upload.array('attachments'), validate(updateDailyLogbookSchema), dailyLogbookController.update);
dailyLogbookRoute.post('/bulk-delete', validate(bulkDeleteSchema), dailyLogbookController.bulkDelete);
dailyLogbookRoute.delete('/:id', dailyLogbookController.delete);
dailyLogbookRoute.post('/:id/reviews', validate(createLogbookReviewSchema), dailyLogbookController.addReview);
