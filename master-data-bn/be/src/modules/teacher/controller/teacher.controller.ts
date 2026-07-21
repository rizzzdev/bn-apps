import { Request, Response, NextFunction } from 'express';
import { TeacherService, teacherService } from '@/modules/teacher/service';
import { sendResponse } from '@/utils/response';
import { BadRequestError } from '@/errors';

export class TeacherController {
  constructor(private service: TeacherService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const userId = req.query.userId as string | undefined;
      const includeUser = req.query.includeUser === "true";
      const includePicture = req.query.includePicture === "true";
      const { data, total } = await this.service.getAll(page, limit, userId, includeUser, includePicture);
      const pagination = { currentPage: page, totalPage: Math.ceil(total / limit), totalData: total, dataPerPage: limit };
      sendResponse(res, 200, 'Success fetch data', data, pagination);
    } catch (error: unknown) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  getStatistics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getStatistics();
      sendResponse(res, 200, 'Success fetch teacher statistics', data);
    } catch (error: unknown) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const includePicture = req.query.includePicture === "true";
      const data = await this.service.getById(req.params.id, includePicture);
      sendResponse(res, 200, 'Success fetch data', data);
    } catch (error: unknown) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.create(req.body);
      sendResponse(res, 201, 'Berhasil ditambahkan', data);
    } catch (error: unknown) {
      next(error instanceof Error ? error : new Error(String(error)));
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.update(req.params.id, req.body);
      sendResponse(res, 200, 'Berhasil diperbarui', data);
    } catch (error: unknown) {
      next(error instanceof Error ? error : new Error(String(error)));
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.params.id);
      sendResponse(res, 200, 'Berhasil dihapus', null);
    } catch (error: unknown) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  uploadPicture = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        sendResponse(res, 400, 'No file uploaded', null);
        return;
      }
      const data = await this.service.uploadPicture(req.params.id, req.file);
      sendResponse(res, 200, 'Foto profil berhasil diunggah', data);
    } catch (error: unknown) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  deletePicture = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.deletePicture(req.params.id);
      sendResponse(res, 200, 'Foto profil berhasil dihapus', data);
    } catch (error: unknown) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  getBatch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ids } = req.body;
      const data = await this.service.getBatchByIds(ids);
      sendResponse(res, 200, 'Data berhasil diambil', data);
    } catch (error: unknown) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  bulkDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.bulkDelete(req.body.ids);
      sendResponse(res, 200, 'Data berhasil dihapus', null);
    } catch (error: unknown) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  bulkUpdateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ids, status } = req.body;
      const data = await this.service.bulkUpdateStatus(ids, status);
      sendResponse(res, 200, 'Status berhasil diperbarui', data);
    } catch (error: unknown) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  bulkCreateFromExcel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new BadRequestError('No file uploaded. Please upload an Excel file with field name "file".');
      const data = await this.service.bulkCreateFromExcel(req.file.buffer);
      sendResponse(res, 201, 'Berhasil ditambahkan', data);
    } catch (error: unknown) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  downloadExcelTemplate = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const buffer = await this.service.getExcelTemplate();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="teachers_template.xlsx"');
      res.send(buffer);
    } catch (error: unknown) { next(error instanceof Error ? error : new Error(String(error))); }
  };
}

export const teacherController = new TeacherController(teacherService);
