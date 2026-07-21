import type { Request, Response, NextFunction } from 'express';
import { lessonSchedulesService } from '@/modules/lesson-schedules/service';
import type { LessonScheduleService } from '@/modules/lesson-schedules/service/lesson-schedules.service';
import { sendResponse } from '@/utils/response';

export class LessonScheduleController {
  constructor(private service: LessonScheduleService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const day = req.query.day as string | undefined;
      const classId = req.query.classId as string | undefined;
      const teacherId = req.query.teacherId as string | undefined;
      const subjectId = req.query.subjectId as string | undefined;

      const { data, total } = await this.service.getAll(page, limit, {
        ...(day && { day }),
        ...(classId && { classId }),
        ...(teacherId && { teacherId }),
        ...(subjectId && { subjectId }),
      });

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
      sendResponse(res, 201, 'Berhasil membuat jadwal', data);
    } catch (error) {
      next(error);
    }
  };

  createBulk = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = Array.isArray(req.body) ? req.body : (req.body as any)?.data || [];
      const results = await this.service.createBulk(items);
      sendResponse(res, 201, `Berhasil membuat ${results.length} jadwal`, results);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.update(req.params.id as string, req.body);
      sendResponse(res, 200, 'Berhasil memperbarui jadwal', data);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.params.id as string);
      sendResponse(res, 200, 'Berhasil menghapus jadwal');
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

export const lessonScheduleController = new LessonScheduleController(lessonSchedulesService);
