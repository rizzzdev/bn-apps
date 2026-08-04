import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../service/dashboard.service';
import { sendResponse } from '#app';
import { SentriError } from 'sentri/core';

export class DashboardController {
  constructor(private service: DashboardService) {}

  getTeacherPendingGrading = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('teacher') || !req.profileId)) {
        throw new SentriError('FORBIDDEN', 'Hanya Guru yang dapat mengakses ini', 403);
      }

      const data = await this.service.getTeacherPendingGrading(req.profileId!);
      sendResponse(res, 200, 'Berhasil mengambil data penilaian tertunda', data);
    } catch (error) {
      next(error);
    }
  };

  getStudentPendingItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('student') || !req.profileId)) {
        throw new SentriError('FORBIDDEN', 'Hanya Murid yang dapat mengakses ini', 403);
      }

      const data = await this.service.getStudentPendingItems(req.profileId!);
      sendResponse(res, 200, 'Berhasil mengambil data item tertunda', data);
    } catch (error) {
      next(error);
    }
  };
}

import { dashboardService } from '../service/dashboard.service';
export const dashboardController = new DashboardController(dashboardService);
