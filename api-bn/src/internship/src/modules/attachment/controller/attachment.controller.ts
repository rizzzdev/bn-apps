import { Request, Response, NextFunction } from 'express';
import { AttachmentService, attachmentService } from '@internship/modules/attachment/service/index.js';
import { CreateAttachmentDto } from '@internship/modules/attachment/domain/index.js';
import path from 'path';
import fs from 'fs';
import { sendResponse } from '@app/index.js';

export class AttachmentController {
  constructor(private service: AttachmentService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { data, total } = await this.service.getAll(page, limit);
      
      const pagination = {
        currentPage: page,
        totalPage: Math.ceil(total / limit),
        totalData: total,
        dataPerPage: limit,
      };

      sendResponse(res, 200, 'Berhasil mengambil data', data, pagination);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getById((req.params.id as string));
      sendResponse(res, 200, 'Berhasil mengambil data', data);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.create(req.body);
      sendResponse(res, 201, 'Berhasil ditambahkan', data);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.update((req.params.id as string), req.body);
      sendResponse(res, 200, 'Berhasil diperbarui', data);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete((req.params.id as string));
      sendResponse(res, 200, 'Berhasil dihapus');
    } catch (error) {
      next(error);
    }
  };

  uploadFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new Error('File tidak ditemukan');
      
      const file = req.file;
      const sizeMB = file.size / (1024 * 1024);
      const ext = file.originalname.split('.').pop() || '';
      const url = `/api/v1/attachments/file/${file.filename}`;
      
      const data = {
        filename: file.filename,
        format: ext,
        size: parseFloat(sizeMB.toFixed(2)),
        url
      };

      const result = await this.service.create(data as CreateAttachmentDto);
      sendResponse(res, 201, 'Berhasil mengupload file', result);
    } catch (error) {
      next(error);
    }
  };

  serveFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { filename } = req.params;
      const filepath = path.resolve(process.cwd(), 'public/attachments', filename as string);
      if (!fs.existsSync(filepath)) {
        return sendResponse(res, 404, 'File tidak ditemukan', null, undefined, true);
      }
      res.sendFile(filepath);
    } catch (error) {
      next(error);
    }
  };

  bulkDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.bulkDelete(req.body.ids);
      sendResponse(res, 200, `Berhasil menghapus ${result.count} data`);
    } catch (error) {
      next(error);
    }
  };
}

export const attachmentController = new AttachmentController(attachmentService);
