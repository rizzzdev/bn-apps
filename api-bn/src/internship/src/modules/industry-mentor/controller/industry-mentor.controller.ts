import { Request, Response, NextFunction } from 'express';
import { IndustryMentorService, industryMentorService } from '@internship/modules/industry-mentor/service/index.js';
import {
  sendResponse,
  createDownloadTemplateHandler,
} from '@app/index.js';

export class IndustryMentorController {
  constructor(private service: IndustryMentorService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const { data, total } = await this.service.getAll(page, limit, search);
      const pagination = { currentPage: page, totalPage: Math.ceil(total / limit), totalData: total, dataPerPage: limit };
      sendResponse(res, 200, 'Berhasil mengambil data mentor', data, pagination);
    } catch (error) { next(error); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getById(req.params.id as string);
      sendResponse(res, 200, 'Berhasil mengambil data mentor', data);
    } catch (error) { next(error); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      const data = await this.service.create(req.body, actorId);
      sendResponse(res, 201, 'Berhasil menambahkan mentor', data);
    } catch (error) { next(error); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      const data = await this.service.update(req.params.id as string, req.body, actorId);
      sendResponse(res, 200, 'Berhasil memperbarui data mentor', data);
    } catch (error) { next(error); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      await this.service.delete(req.params.id as string, actorId);
      sendResponse(res, 200, 'Berhasil menghapus mentor', null);
    } catch (error) { next(error); }
  };

  // --- Batch operations (standar) ---

  bulkDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      const result = await this.service.bulkDelete(req.body.ids, actorId);
      sendResponse(res, 200, `Berhasil menghapus ${result.count} mentor`, { count: result.count });
    } catch (error) { next(error); }
  };

  bulkEditCompanyId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ids, companyId } = req.body;
      const result = await this.service.bulkUpdateCompanyId(ids, companyId || null);
      sendResponse(res, 200, `Berhasil memindahkan ${result.count} mentor`, { count: result.count });
    } catch (error) { next(error); }
  };

  bulkCreateJson = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      const count = await this.service.bulkCreateJson(req.body, actorId);
      sendResponse(res, 201, `Berhasil menambahkan ${count} mentor`, { count });
    } catch (error) { next(error); }
  };

  downloadTemplate = createDownloadTemplateHandler(
    'industry_mentors_template.xlsx',
    () => industryMentorService.getExcelTemplate(),
  );

  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.changePassword(req.params.id as string, req.body);
      sendResponse(res, 200, result.message, null);
    } catch (error) { next(error); }
  };
}

export const industryMentorController = new IndustryMentorController(industryMentorService);
