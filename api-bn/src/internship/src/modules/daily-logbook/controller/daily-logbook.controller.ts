import { Request, Response, NextFunction } from 'express';
import { DailyLogbookService, dailyLogbookService } from '#internship/modules/daily-logbook/service/index.js';
import { sendResponse } from '#app';

export class DailyLogbookController {
  constructor(private service: DailyLogbookService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const placementId = req.query.placementId as string;
      const studentId = req.query.studentId as string;
      const companyId = req.query.companyId as string;
      const search = req.query.search as string;
      const mentorId = req.query.mentorId as string;
      const teacherId = req.query.teacherId as string;
      const status = req.query.status as string;
      
      const { data, total } = await this.service.getAll(page, limit, placementId, studentId, companyId, search, mentorId, teacherId, status);
      
      const pagination = {
        currentPage: page,
        totalPage: Math.ceil(total / limit),
        totalData: total,
        dataPerPage: limit,
      };

      sendResponse(res, 200, 'Berhasil mengambil data', data, pagination);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getById((req.params.id as string));
      sendResponse(res, 200, 'Berhasil mengambil data', data);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      const files = req.files as Express.Multer.File[] | undefined;
      const data = await this.service.create(req.body, files, actorId);
      sendResponse(res, 201, 'Berhasil ditambahkan', data);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      const files = req.files as Express.Multer.File[] | undefined;
      const data = await this.service.update((req.params.id as string), req.body, files, actorId);
      sendResponse(res, 200, 'Berhasil diperbarui', data);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      await this.service.delete((req.params.id as string), actorId);
      sendResponse(res, 200, 'Berhasil dihapus');
    } catch (error) {
      next(error);
    }
  };
  addReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      const reviewerId = req.user?.id || req.body.reviewerId;
      const reviewerType = req.user?.roles?.includes('teacher' as never) ? 'teacher' : 'mentor';

      const data = await this.service.addReview(
        (req.params.id as string), 
        reviewerId, 
        req.body.action, 
        req.body.content,
        reviewerType,
        actorId
      );
      sendResponse(res, 201, 'Berhasil menambahkan review', data);
    } catch (error) {
      next(error);
    }
  };

  bulkDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.bulkDelete(req.body.ids);
      sendResponse(res, 200, `Berhasil menghapus ${result.count} data`);
    } catch (error) {
      next(error);
    }
  };
}

export const dailyLogbookController = new DailyLogbookController(dailyLogbookService);
