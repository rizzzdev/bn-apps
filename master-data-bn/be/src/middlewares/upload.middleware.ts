import multer, { memoryStorage } from 'multer';
import { BadRequestError } from '@/errors';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';

// -- Excel upload (existing) --
const EXCEL_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

const excelStorage = memoryStorage();

const excelFileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (EXCEL_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only Excel files (.xlsx, .xls) are allowed') as any);
  }
};

const excelUpload = multer({
  storage: excelStorage,
  fileFilter: excelFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadExcel = excelUpload.single('file');

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
