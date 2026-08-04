import { Request, Response, NextFunction } from 'express';
import { CompanyService, companyService } from '#internship/modules/company/service/index.js';
import {
  sendResponse,
  createDownloadTemplateHandler,
} from '#app';

export class CompanyController {
  constructor(private service: CompanyService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const { data, total } = await this.service.getAll(page, limit, search);
      const pagination = { currentPage: page, totalPage: Math.ceil(total / limit), totalData: total, dataPerPage: limit };
      sendResponse(res, 200, 'Berhasil mengambil data perusahaan', data, pagination);
    } catch (error) { next(error); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getById(req.params.id as string);
      sendResponse(res, 200, 'Berhasil mengambil data perusahaan', data);
    } catch (error) { next(error); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      const data = await this.service.create(req.body, actorId);
      sendResponse(res, 201, 'Berhasil menambahkan perusahaan', data);
    } catch (error) { next(error); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      const data = await this.service.update(req.params.id as string, req.body, actorId);
      sendResponse(res, 200, 'Berhasil memperbarui data perusahaan', data);
    } catch (error) { next(error); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      await this.service.delete(req.params.id as string, actorId);
      sendResponse(res, 200, 'Berhasil menghapus perusahaan', null);
    } catch (error) { next(error); }
  };

  // --- Batch operations (standar) ---

  bulkDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      const result = await this.service.bulkDelete(req.body.ids, actorId);
      sendResponse(res, 200, `Berhasil menghapus ${result.count} perusahaan`, { count: result.count });
    } catch (error) { next(error); }
  };

  bulkCreateJson = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      const count = await this.service.bulkCreateJson(req.body, actorId);
      sendResponse(res, 201, `Berhasil menambahkan ${count} perusahaan`, { count });
    } catch (error) { next(error); }
  };

  downloadTemplate = createDownloadTemplateHandler(
    'companies_template.xlsx',
    () => companyService.getExcelTemplate(),
  );
}

export const companyController = new CompanyController(companyService);
