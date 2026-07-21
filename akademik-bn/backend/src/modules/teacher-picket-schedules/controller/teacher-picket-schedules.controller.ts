import type { Request, Response, NextFunction } from 'express';
import { TeacherPicketScheduleService, teacherPicketSchedulesService } from '@/modules/teacher-picket-schedules/service';
import { sendResponse } from '@/utils/response';

export class TeacherPicketScheduleController {
  constructor(private service: TeacherPicketScheduleService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
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
      sendResponse(res, 201, 'Berhasil membuat data', data);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.update(req.params.id as string, req.body);
      sendResponse(res, 200, 'Berhasil memperbarui data', data);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.params.id as string);
      sendResponse(res, 200, 'Berhasil menghapus data');
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

  createBulk = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data } = req.body as { data: any[] };
      const result = await this.service.createBulk(data);
      sendResponse(res, 201, 'Berhasil membuat data', result);
    } catch (error) {
      next(error);
    }
  };
}

export const teacherPicketScheduleController = new TeacherPicketScheduleController(teacherPicketSchedulesService);
