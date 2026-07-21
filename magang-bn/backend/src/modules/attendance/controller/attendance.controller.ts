import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from '../service/index.js';
import { sendResponse } from '@/utils/response.js';

export class AttendanceController {
  constructor(private service: AttendanceService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      const data = await this.service.create(req.body, actorId);
      sendResponse(res, 201, 'Berhasil mencatat presensi', data);
    } catch (error) {
      console.error("Attendance create error:", error);
      next(error);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const studentId = req.query.studentId as string;
      const teacherId = req.query.teacherId as string;
      const companyId = req.query.companyId as string;
      const mentorId = req.query.mentorId as string;
      const { data, total } = await this.service.getAll(page, limit, search, studentId, teacherId, companyId, mentorId);
      
      const pagination = {
        currentPage: page,
        totalPage: Math.ceil(total / limit),
        totalData: total,
        dataPerPage: limit,
      };

      sendResponse(res, 200, 'Berhasil mengambil data presensi', data, pagination);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getById(req.params.id as string);
      sendResponse(res, 200, 'Berhasil mengambil data presensi', data);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      const data = await this.service.update(req.params.id as string, req.body, actorId);
      sendResponse(res, 200, 'Berhasil memperbarui data presensi', data);
    } catch (error) {
      next(error);
    }
  };
}

import { attendanceService } from '../service/index.js';
export const attendanceController = new AttendanceController(attendanceService);
