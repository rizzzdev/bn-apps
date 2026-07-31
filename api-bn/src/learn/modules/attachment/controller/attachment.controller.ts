import { Request, Response, NextFunction } from 'express';
import { AttachmentService } from '../service/attachment.service';
import { sendResponse, getStorage } from '@app/index.js';

export class AttachmentController {
  constructor(private service: AttachmentService) {}

  uploadSingle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        sendResponse(res, 400, 'File tidak ditemukan');
        return;
      }
      const storage = getStorage();
      await storage.upload(req.file.filename, req.file);
      const data = await this.service.upload(req.file);
      sendResponse(res, 201, 'File berhasil diunggah', data);
    } catch (error) {
      next(error);
    }
  };

  uploadBulk = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        sendResponse(res, 400, 'File tidak ditemukan');
        return;
      }
      const storage = getStorage();
      for (const file of req.files) {
        await storage.upload(file.filename, file);
      }
      const data = await this.service.uploadBulk(req.files);
      sendResponse(res, 201, `Berhasil mengunggah ${data.length} file`, { count: data.length, items: data });
    } catch (error) {
      next(error);
    }
  };

  deleteSingle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as { id: string };
      await this.service.delete(id);
      sendResponse(res, 200, 'Attachment berhasil dihapus');
    } catch (error) {
      next(error);
    }
  };

  // --- Batch operations (standar) ---

  getBatch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ids } = req.body;
      const data = await this.service.getBatchByIds(ids);
      sendResponse(res, 200, 'Berhasil mengambil data attachment', data);
    } catch (error) {
      next(error);
    }
  };

  deleteBulk = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.bulkDelete(req.body.ids);
      sendResponse(res, 200, `Berhasil menghapus ${req.body.ids.length} attachment`, { count: req.body.ids.length });
    } catch (error) {
      next(error);
    }
  };

  serveFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { url } = req.params as { url: string };
      const attachment = await this.service.getFileByUrl(url);
      const storage = getStorage();
      const { buffer, contentType } = await storage.getFile(attachment.url);
      res.set('Content-Type', contentType);
      res.set('Content-Disposition', `inline; filename="${attachment.filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  };
}

import { attachmentService } from '../service/attachment.service';
export const attachmentController = new AttachmentController(attachmentService);
