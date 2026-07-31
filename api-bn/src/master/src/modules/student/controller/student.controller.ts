import { Request, Response, NextFunction } from 'express';
import { StudentService, studentService } from '@master/modules/student/service';
import {
  sendResponse,
  createDownloadTemplateHandler,
  createUploadExcelHandler,
} from '@app/index.js';

export class StudentController {
  constructor(private service: StudentService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const userId = req.query.userId as string | undefined;
      const includeCurrentClass = req.query.includeCurrentClass === "true";
      const includeUser = req.query.includeUser === "true";
      const includePicture = req.query.includePicture === "true";

      const { data, total } = await this.service.getAll(
        page, limit, userId, includeCurrentClass, includeUser, includePicture,
      );
      const pagination = { currentPage: page, totalPage: Math.ceil(total / limit), totalData: total, dataPerPage: limit };
      sendResponse(res, 200, 'Berhasil mengambil data murid', data, pagination);
    } catch (error) {
      next(error instanceof Error ? error : new Error(String(error)));
    }
  };

  getStatistic = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getStatistic();
      sendResponse(res, 200, 'Berhasil mengambil statistik murid', data);
    } catch (error) {
      next(error instanceof Error ? error : new Error(String(error)));
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const includeCurrentClass = req.query.includeCurrentClass === "true";
      const includePicture = req.query.includePicture === "true";
      const data = await this.service.getById(req.params.id as string, includeCurrentClass, includePicture);
      sendResponse(res, 200, 'Berhasil mengambil data murid', data);
    } catch (error) {
      next(error instanceof Error ? error : new Error(String(error)));
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.create(req.body);
      sendResponse(res, 201, 'Berhasil menambahkan murid', data);
    } catch (error) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.update(req.params.id as string, req.body);
      sendResponse(res, 200, 'Berhasil memperbarui data murid', data);
    } catch (error) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.params.id as string);
      sendResponse(res, 200, 'Berhasil menghapus murid', null);
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
      sendResponse(res, 200, 'Berhasil mengambil data murid', data);
    } catch (error) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  bulkCreate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Spec konvensi: body = { data: Student[] }, service menerima array.
      const data = await this.service.bulkCreate(req.body.data);
      sendResponse(res, 201, `Berhasil menambahkan ${Array.isArray(data) ? data.length : 0} murid`, { count: Array.isArray(data) ? data.length : 0, items: data });
    } catch (error) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  bulkDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.bulkDelete(req.body.ids);
      sendResponse(res, 200, `Berhasil menghapus ${req.body.ids.length} murid`, { count: req.body.ids.length });
    } catch (error) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  bulkUpdateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ids, status } = req.body;
      const updated = await this.service.bulkUpdateStatus(ids, status);
      sendResponse(res, 200, `Berhasil memperbarui status ${updated.length} murid`, { count: updated.length, items: updated });
    } catch (error) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  bulkCreateFromExcel = createUploadExcelHandler(
    (buffer) => studentService.bulkCreateFromExcel(buffer),
  );

  downloadExcelTemplate = createDownloadTemplateHandler(
    'students_template.xlsx',
    () => studentService.getExcelTemplate(),
  );
}

export const studentController = new StudentController(studentService);
