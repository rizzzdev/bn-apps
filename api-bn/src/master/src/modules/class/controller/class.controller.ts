import { Request, Response, NextFunction } from 'express';
import { ClassService, classService } from '#master/modules/class/service';
import {
  sendResponse,
  createDownloadTemplateHandler,
  createUploadExcelHandler,
} from '#app';

export class ClassController {
  constructor(private service: ClassService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;
      let majorId: string | string[] | undefined;
      if (req.query.majorId) {
        if (Array.isArray(req.query.majorId)) {
          majorId = req.query.majorId as string[];
        } else if (typeof req.query.majorId === 'string' && req.query.majorId.includes(',')) {
          majorId = (req.query.majorId as string).split(',').filter(Boolean);
        } else {
          majorId = req.query.majorId as string;
        }
      }
      const includeMajor = req.query.includeMajor === 'true';
      const includeCurrentStudent = req.query.includeCurrentStudent === 'true';
      const { data, total } = await this.service.getAll(page, limit, search, majorId, includeMajor, includeCurrentStudent);
      const pagination = { currentPage: page, totalPage: Math.ceil(total / limit), totalData: total, dataPerPage: limit };
      sendResponse(res, 200, 'Berhasil mengambil data kelas', data, pagination);
    } catch (error) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const includeMajor = req.query.includeMajor === 'true';
      const includeCurrentStudent = req.query.includeCurrentStudent === 'true';
      const data = await this.service.getById(req.params.id as string, includeMajor, includeCurrentStudent);
      sendResponse(res, 200, 'Berhasil mengambil data kelas', data);
    } catch (error) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.create(req.body);
      sendResponse(res, 201, 'Berhasil menambahkan kelas', data);
    } catch (error) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.update(req.params.id as string, req.body);
      sendResponse(res, 200, 'Berhasil memperbarui data kelas', data);
    } catch (error) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.params.id as string);
      sendResponse(res, 200, 'Berhasil menghapus kelas', null);
    } catch (error) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  // --- Batch operations (standar) ---

  getBatch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ids } = req.body;
      const data = await this.service.getBatchByIds(ids);
      sendResponse(res, 200, 'Berhasil mengambil data kelas', data);
    } catch (error) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  bulkDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.bulkDelete(req.body.ids);
      sendResponse(res, 200, `Berhasil menghapus ${req.body.ids.length} kelas`, { count: req.body.ids.length });
    } catch (error) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  downloadTemplate = createDownloadTemplateHandler(
    'classes_template.xlsx',
    () => classService.getExcelTemplate(),
  );

  bulkCreate = createUploadExcelHandler(
    (buffer) => classService.bulkCreateFromExcel(buffer),
  );
}

export const classController = new ClassController(classService);
