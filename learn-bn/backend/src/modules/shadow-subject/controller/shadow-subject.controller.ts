import type { Request, Response, NextFunction } from 'express';
import { SubjectService, subjectService } from '../service';
import { sendResponse } from '@/utils/response';

export class SubjectController {
  constructor(private service: SubjectService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const { data, total } = await this.service.getAll(page, limit);
      
      sendResponse(res, 200, 'Berhasil mengambil data', data, {
        currentPage: page,
        totalPage: Math.ceil(total / limit) || 1,
        totalData: total,
        dataPerPage: limit,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const subjectController = new SubjectController(subjectService);
