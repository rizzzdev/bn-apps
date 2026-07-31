import { Request, Response, NextFunction } from 'express';
import { GradeService } from '../service/grade.service';
import { sendResponse } from '@app/index.js';
import { SentriError } from 'sentri/core';

export class GradeController {
  constructor(private service: GradeService) {}

  getMyGrades = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('student') || !req.profileId)) {
        throw new SentriError('FORBIDDEN', 'Hanya Murid yang dapat mengakses ini', 403);
      }
      
      const { classId } = req.params as { classId: string };
      const data = await this.service.getMyGrades(classId, req.profileId!);
      sendResponse(res, 200, 'Berhasil mengambil rekap nilai saya', data);
    } catch (error) {
      next(error);
    }
  };

  getClassGrades = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('teacher') || !req.profileId)) {
        throw new SentriError('FORBIDDEN', 'Hanya Guru yang dapat mengakses rekapitulasi nilai kelas', 403);
      }

      const { classId } = req.params as { classId: string };
      const data = await this.service.getClassGrades(classId, req.profileId!);
      sendResponse(res, 200, 'Berhasil mengambil rekapitulasi nilai kelas', data);
    } catch (error) {
      next(error);
    }
  };
}

import { gradeService } from '../service/grade.service';
export const gradeController = new GradeController(gradeService);
