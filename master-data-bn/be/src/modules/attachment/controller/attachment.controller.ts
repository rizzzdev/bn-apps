import { Request, Response, NextFunction } from 'express';
import { AttachmentService, attachmentService } from '@/modules/attachment/service';
import { sendResponse } from '@/utils/response';
import path from 'path';
import fs from 'fs';
import { getStorage } from '@/utils/storage';

export class AttachmentController {
  constructor(private service: AttachmentService) {}

  uploadSingle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        sendResponse(res, 400, 'No file uploaded', null);
        return;
      }
      const data = await this.service.upload(req.file);
      sendResponse(res, 201, 'File uploaded successfully', data);
    } catch (error: unknown) {
      next(error);
    }
  };

  uploadBulk = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        sendResponse(res, 400, 'No files uploaded', null);
        return;
      }
      const data = await this.service.uploadBulk(req.files as Express.Multer.File[]);
      sendResponse(res, 201, 'Files uploaded successfully', data);
    } catch (error: unknown) {
      next(error);
    }
  };

  deleteSingle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.params.id);
      sendResponse(res, 200, 'Attachment deleted successfully', null);
    } catch (error: unknown) {
      next(error);
    }
  };

  deleteBulk = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.bulkDelete(req.body.ids);
      sendResponse(res, 200, 'Attachments deleted successfully', null);
    } catch (error: unknown) {
      next(error);
    }
  };

  getBatch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ids } = req.body;
      const data = await this.service.getBatchByIds(ids);
      sendResponse(res, 200, 'Attachments fetched successfully', data);
    } catch (error: unknown) {
      next(error);
    }
  };

  serveFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { url } = req.params;
      const attachment = await this.service.getFileByUrl(url);
      const storage = getStorage();
      const { buffer, contentType } = await storage.getFile(attachment.url);
      res.set('Content-Type', contentType);
      res.set('Content-Disposition', `inline; filename="${attachment.filename}"`);
      res.send(buffer);
    } catch (error: unknown) {
      next(error);
    }
  };
}

export const attachmentController = new AttachmentController(attachmentService);
