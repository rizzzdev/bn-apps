import multer, { memoryStorage } from 'multer';
import { BadRequestError } from '../errors/index.js';
import { Request } from 'express';

// -- Excel upload (single source of truth) --
// Dipakai oleh modul master, academic, dan lainnya lewat barrel `#app`.
const EXCEL_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

const excelFileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (EXCEL_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only Excel files (.xlsx, .xls) are allowed'));
  }
};

const excelUpload = multer({
  storage: memoryStorage(),
  fileFilter: excelFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

/** Middleware untuk upload 1 file Excel pada field multipart `"file"`. */
export const uploadExcel = excelUpload.single('file');
