import { Request, Response, NextFunction } from 'express';
import { ApplicationService, applicationService } from '#master/modules/application/service';
import {
  sendResponse,
  createDownloadTemplateHandler,
  createUploadExcelHandler,
} from '#app';

export class ApplicationController {
  constructor(private service: ApplicationService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { data, total } = await this.service.getAll(page, limit);
      const pagination = { currentPage: page, totalPage: Math.ceil(total / limit), totalData: total, dataPerPage: limit };
      sendResponse(res, 200, 'Berhasil mengambil data aplikasi', data, pagination);
    } catch (error) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getById(req.params.id as string);
      sendResponse(res, 200, 'Berhasil mengambil data aplikasi', data);
    } catch (error) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.create(req.body);
      sendResponse(res, 201, 'Berhasil menambahkan aplikasi', data);
    } catch (error) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.update(req.params.id as string, req.body);
      sendResponse(res, 200, 'Berhasil memperbarui data aplikasi', data);
    } catch (error) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.params.id as string);
      sendResponse(res, 200, 'Berhasil menghapus aplikasi', null);
    } catch (error) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  // --- Batch operations (standar) ---

  getBatch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ids } = req.body;
      const data = await this.service.getBatchByIds(ids);
      sendResponse(res, 200, 'Berhasil mengambil data aplikasi', data);
    } catch (error) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  bulkDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.bulkDelete(req.body.ids);
      sendResponse(res, 200, `Berhasil menghapus ${req.body.ids.length} aplikasi`, { count: req.body.ids.length });
    } catch (error) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  downloadTemplate = createDownloadTemplateHandler(
    'applications_template.xlsx',
    () => applicationService.getExcelTemplate(),
  );

  bulkCreate = createUploadExcelHandler(
    (buffer) => applicationService.bulkCreateFromExcel(buffer),
  );
}

export const applicationController = new ApplicationController(applicationService);
