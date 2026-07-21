import { Request, Response, NextFunction } from 'express';
import { SubjectService, subjectService } from '@/modules/subject/service';
import { sendResponse } from '@/utils/response';
import { BadRequestError } from '@/errors';

export class SubjectController {
  constructor(private service: SubjectService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { data, total } = await this.service.getAll(page, limit);
      const pagination = { currentPage: page, totalPage: Math.ceil(total / limit), totalData: total, dataPerPage: limit };
      sendResponse(res, 200, 'Success fetch data', data, pagination);
    } catch (error: unknown) { next(error instanceof Error ? error : new Error(String(error))); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getById(req.params.id);
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
}

export const subjectController = new SubjectController(subjectService);
