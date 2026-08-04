import { Request, Response, NextFunction } from 'express';
import { TeacherService, teacherService } from '#master/modules/teacher/service';
import {
  sendResponse,
  createDownloadTemplateHandler,
  createUploadExcelHandler,
} from '#app';

export class TeacherController {
  constructor(private service: TeacherService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;
      const userId = req.query.userId as string | undefined;
      const includeUser = req.query.includeUser === "true";
      const includePicture = req.query.includePicture === "true";
      const { data, total } = await this.service.getAll(page, limit, search, userId, includeUser, includePicture);
      const pagination = { currentPage: page, totalPage: Math.ceil(total / limit), totalData: total, dataPerPage: limit };
      sendResponse(res, 200, 'Berhasil mengambil data guru', data, pagination);
    } catch (error) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  getStatistics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getStatistics();
      sendResponse(res, 200, 'Berhasil mengambil statistik guru', data);
    } catch (error) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const includePicture = req.query.includePicture === "true";
      const data = await this.service.getById(req.params.id as string, includePicture);
      sendResponse(res, 200, 'Berhasil mengambil data guru', data);
    } catch (error) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.create(req.body);
      sendResponse(res, 201, 'Berhasil menambahkan guru', data);
    } catch (error) {
      next(error instanceof Error ? error : new Error(String(error)));
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.update(req.params.id as string, req.body);
      sendResponse(res, 200, 'Berhasil memperbarui data guru', data);
    } catch (error) {
      next(error instanceof Error ? error : new Error(String(error)));
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.params.id as string);
      sendResponse(res, 200, 'Berhasil menghapus guru', null);
    } catch (error) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  uploadPicture = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        sendResponse(res, 400, 'File tidak ditemukan', null);
        return;
      }
      const data = await this.service.uploadPicture(req.params.id as string, req.file);
      sendResponse(res, 200, 'Foto profil berhasil diunggah', data);
    } catch (error) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  deletePicture = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.deletePicture(req.params.id as string);
      sendResponse(res, 200, 'Foto profil berhasil dihapus', data);
    } catch (error) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  // --- Batch operations (standar) ---

  getBatch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ids } = req.body;
      const data = await this.service.getBatchByIds(ids);
      sendResponse(res, 200, 'Berhasil mengambil data guru', data);
    } catch (error) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  bulkDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.bulkDelete(req.body.ids);
      sendResponse(res, 200, `Berhasil menghapus ${req.body.ids.length} data guru`, { count: req.body.ids.length });
    } catch (error) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  bulkUpdateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ids, status } = req.body;
      const updated = await this.service.bulkUpdateStatus(ids, status);
      sendResponse(res, 200, `Berhasil memperbarui status ${updated.length} guru`, { count: updated.length, items: updated });
    } catch (error) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  bulkCreateFromExcel = createUploadExcelHandler(
    (buffer) => teacherService.bulkCreateFromExcel(buffer),
  );

  downloadExcelTemplate = createDownloadTemplateHandler(
    'teachers_template.xlsx',
    () => teacherService.getExcelTemplate(),
  );

  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.changePassword(req.params.id as string, req.body);
      sendResponse(res, 200, result.message, null);
    } catch (error) { next(error instanceof Error ? error : new Error(String(error))); }
  };
}

export const teacherController = new TeacherController(teacherService);
