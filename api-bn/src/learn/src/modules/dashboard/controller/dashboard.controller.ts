import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../service/dashboard.service';
import { sendResponse } from '#app';
import { SentriError } from 'sentri/core';

const ALLOW_CURRICULUM = ['super_admin', 'waka_kurikulum'] as const;

function guardCurriculum(req: Request) {
  if (!req.user?.roles.some((role: string) => ALLOW_CURRICULUM.includes(role as typeof ALLOW_CURRICULUM[number]))) {
    throw new SentriError('FORBIDDEN', 'Hanya Waka Kurikulum & Admin yang dapat mengakses', 403);
  }
}

export class DashboardController {
  constructor(private service: DashboardService) {}

  getTeacherPendingGrading = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('teacher') || !req.profileId)) {
        throw new SentriError('FORBIDDEN', 'Hanya Guru yang dapat mengakses ini', 403);
      }
      const data = await this.service.getTeacherPendingGrading(req.profileId!);
      sendResponse(res, 200, 'Berhasil mengambil data penilaian tertunda', data);
    } catch (error) { next(error); }
  };

  getStudentPendingItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('student') || !req.profileId)) {
        throw new SentriError('FORBIDDEN', 'Hanya Murid yang dapat mengakses ini', 403);
      }
      const data = await this.service.getStudentPendingItems(req.profileId!);
      sendResponse(res, 200, 'Berhasil mengambil data item tertunda', data);
    } catch (error) { next(error); }
  };

  getCurriculumOverview = async (req: Request, res: Response, next: NextFunction) => {
    try { guardCurriculum(req); const data = await this.service.getCurriculumOverview(); sendResponse(res, 200, 'Berhasil mengambil data overview kurikulum', data); } catch (error) { next(error); }
  };

  getCurriculumTeachers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      guardCurriculum(req);
      const page = parseInt(String(req.query.page)) || 1;
      const limit = parseInt(String(req.query.limit)) || 15;
      const search = req.query.search ? String(req.query.search) : undefined;
      const data = await this.service.getCurriculumTeachers(page, limit, search);
      sendResponse(res, 200, 'Berhasil mengambil data monitoring guru', data);
    } catch (error) { next(error); }
  };

  getCurriculumStudentsAtRisk = async (req: Request, res: Response, next: NextFunction) => {
    try {
      guardCurriculum(req);
      const page = parseInt(String(req.query.page)) || 1;
      const limit = parseInt(String(req.query.limit)) || 20;
      const threshold = parseInt(String(req.query.threshold)) || 50;
      const classId = req.query.classId ? String(req.query.classId) : undefined;
      const data = await this.service.getCurriculumStudentsAtRisk(page, limit, threshold, classId);
      sendResponse(res, 200, 'Berhasil mengambil data deteksi dini murid', data);
    } catch (error) { next(error); }
  };

  getCurriculumClasses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      guardCurriculum(req); const page = parseInt(String(req.query.page)) || 1;
      const limit = parseInt(String(req.query.limit)) || 20;
      const data = await this.service.getCurriculumClasses(page, limit);
      sendResponse(res, 200, 'Berhasil mengambil data evaluasi kelas', data);
    } catch (error) { next(error); }
  };
}

import { dashboardService } from '../service/dashboard.service';
export const dashboardController = new DashboardController(dashboardService);
