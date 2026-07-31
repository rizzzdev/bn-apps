import type { Request, Response, NextFunction } from 'express';
import { MajorHeadService, majorHeadsService } from '@academic/modules/major-heads/service';
import { sendResponse } from '@app/index.js';
import { BaseController } from '@academic/utils/index.js';

export class MajorHeadController extends BaseController<any, any, any> {
  constructor(protected service: MajorHeadService) {
    super(service);
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const majorId = req.query.majorId as string | undefined;
      const academicYearId = req.query.academicYearId as string | undefined;
      const status = req.query.status as string | undefined;

      if (majorId || academicYearId || status) {
        const { data, total } = await this.service.getFiltered(page, limit, { majorId, academicYearId, status });
        sendResponse(res, 200, 'Berhasil mengambil data', data, {
          currentPage: page,
          totalPage: Math.ceil(total / limit),
          totalData: total,
          dataPerPage: limit,
        });
      } else {
        const { data, total } = await this.service.getAll(page, limit);
        sendResponse(res, 200, 'Berhasil mengambil data', data, {
          currentPage: page,
          totalPage: Math.ceil(total / limit),
          totalData: total,
          dataPerPage: limit,
        });
      }
    } catch (error) {
      next(error);
    }
  };

  assignHead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.assignHead(req.body);
      sendResponse(res, 200, result.message, result.data);
    } catch (error) {
      next(error);
    }
  };
}

export const majorHeadController = new MajorHeadController(majorHeadsService);
