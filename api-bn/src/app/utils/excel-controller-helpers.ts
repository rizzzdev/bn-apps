import { Request, Response, NextFunction } from 'express';
import { sendResponse, BadRequestError } from '@app/index.js';

/**
 * Factory Express handler untuk download Excel template.
 *
 * Konvensi yang dipakai di seluruh project:
 *  - GET `/{resource}/template`
 *  - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
 *  - `Content-Disposition: attachment; filename="<resource>_template.xlsx"`
 */
export function createDownloadTemplateHandler(
  filename: string,
  getTemplate: () => Promise<Buffer>,
) {
  return async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const buffer = await getTemplate();
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

/**
 * Factory Express handler untuk upload+proses Excel.
 *
 * Konvensi:
 *  - POST `/{resource}/batch/excel`
 *  - Field multipart name `"file"`
 *  - Delegasi pemrosesan buffer ke `processFile` (service).
 *
 * `processFile` menerima buffer Excel dan bertanggung jawab untuk
 * memparsing, memvalidasi, dan menyimpan baris.
 */
export function createUploadExcelHandler<R>(
  processFile: (buffer: Buffer) => Promise<R>,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new BadRequestError(
          'File tidak ditemukan. Silakan upload file Excel (.xlsx/.xls) pada field "file".',
        );
      }
      const result = await processFile(req.file.buffer);
      sendResponse(
        res,
        201,
        'Berhasil menambahkan data dari Excel',
        result,
      );
    } catch (error) {
      next(error instanceof Error ? error : new Error(String(error)));
    }
  };
}
