import { Request, Response, NextFunction } from 'express';
import { AttachmentService } from '../service/attachment.service';
import { sendResponse } from '@/utils/response';
import { getStorage } from '@/utils/storage';

export class AttachmentController {
  constructor(private service: AttachmentService) {}

  uploadSingle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        sendResponse(res, 400, 'No file uploaded');
        return;
      }
      
      // Simpan file fisik dengan nama yang di-generate multer
      const storage = getStorage();
      const url = await storage.upload(req.file.filename, req.file);

      // Rekam metadata ke database
      const data = await this.service.upload(req.file);

      sendResponse(res, 201, 'File uploaded successfully', data);
    } catch (error) {
      next(error);
    }
  };

  uploadBulk = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        sendResponse(res, 400, 'No files uploaded');
        return;
      }

      const storage = getStorage();
      for (const file of req.files) {
        await storage.upload(file.filename, file);
      }

      const data = await this.service.uploadBulk(req.files);
      sendResponse(res, 201, 'Files uploaded successfully', data);
    } catch (error) {
      next(error);
    }
  };

  deleteSingle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as { id: string };
      await this.service.delete(id);
      sendResponse(res, 200, 'Attachment deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteBulk = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.bulkDelete(req.body.ids);
      sendResponse(res, 200, 'Attachments deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  getBatch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ids } = req.body;
      const data = await this.service.getBatchByIds(ids);
      sendResponse(res, 200, 'Attachments fetched successfully', data);
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
