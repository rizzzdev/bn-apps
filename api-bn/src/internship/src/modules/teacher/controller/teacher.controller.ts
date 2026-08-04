import { Request, Response, NextFunction } from 'express';
import { TeacherService, teacherService } from '#internship/modules/teacher/service/index.js';
import { sendResponse } from '#app';

export class TeacherController {
  constructor(private service: TeacherService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const { data, total } = await this.service.getAll(page, limit, search);
      
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

}

export const teacherController = new TeacherController(teacherService);
