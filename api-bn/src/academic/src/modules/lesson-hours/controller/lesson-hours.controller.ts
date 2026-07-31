import type { Request, Response, NextFunction } from 'express';
import { lessonHoursService } from '@academic/modules/lesson-hours/service';
import type { LessonHourService } from '@academic/modules/lesson-hours/service';
import { sendResponse } from '@app/index.js';

export class LessonHourController {
  constructor(private service: LessonHourService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { data, total } = await this.service.getAll(page, limit);

      sendResponse(res, 200, 'Berhasil mengambil data', data, {
        currentPage: page,
        totalPage: Math.ceil(total / limit),
        totalData: total,
        dataPerPage: limit,
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getById(req.params.id as string);
      sendResponse(res, 200, 'Berhasil mengambil data', data);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.create(req.body);
      sendResponse(res, 201, 'Berhasil membuat jam pelajaran', data);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.update(req.params.id as string, req.body);
      sendResponse(res, 200, 'Berhasil memperbarui jam pelajaran', data);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.params.id as string);
      sendResponse(res, 200, 'Berhasil menghapus jam pelajaran');
    } catch (error) {
      next(error);
    }
  };

  deleteBulk = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ids } = req.body as { ids: string[] };
      const result = await this.service.deleteBulk(ids);
      sendResponse(res, 200, 'Berhasil menghapus data', result);
    } catch (error) {
      next(error);
    }
  };

  updateStatusBulk = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ids, status } = req.body as { ids: string[]; status: string };
      const result = await this.service.updateStatusBulk(ids, status);
      sendResponse(res, 200, 'Berhasil memperbarui status', result);
    } catch (error) {
      next(error);
    }
  };
}

export const lessonHourController = new LessonHourController(lessonHoursService);
