import { Request, Response, NextFunction } from 'express';
import { AssignmentSubmissionService } from '../service/assignment-submission.service';
import { sendResponse } from '@/utils/response';
import { SentriError } from 'sentri/core';

export class AssignmentSubmissionController {
  constructor(private service: AssignmentSubmissionService) {}

  submit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('student') || !req.profileId)) {
        throw new SentriError('FORBIDDEN', 'Hanya Murid yang dapat mengumpulkan tugas', 403);
      }
      
      const { assignmentId } = req.params as { assignmentId: string };
      const data = await this.service.submit(assignmentId, req.profileId!, req.body);
      sendResponse(res, 201, 'Tugas berhasil dikumpulkan', data);
    } catch (error) {
      next(error);
    }
  };

  getMySubmission = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('student') || !req.profileId)) {
        throw new SentriError('FORBIDDEN', 'Hanya Murid yang dapat mengakses ini', 403);
      }

      const { assignmentId } = req.params as { assignmentId: string };
      const data = await this.service.getMySubmission(assignmentId, req.profileId!);
      sendResponse(res, 200, 'Berhasil mengambil data pengumpulan tugas', data);
    } catch (error) {
      next(error);
    }
  };

  getAllSubmissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('teacher') || !req.profileId)) {
        throw new SentriError('FORBIDDEN', 'Hanya Guru yang dapat melihat semua pengumpulan', 403);
      }

      const { assignmentId } = req.params as { assignmentId: string };
      const data = await this.service.getAllSubmissions(assignmentId, req.profileId!);
      sendResponse(res, 200, 'Berhasil mengambil daftar pengumpulan tugas', data);
    } catch (error) {
      next(error);
    }
  };

  gradeSubmission = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('teacher') || !req.profileId)) {
        throw new SentriError('FORBIDDEN', 'Hanya Guru yang dapat menilai tugas', 403);
      }

      const { submissionId } = req.params as { submissionId: string };
      const data = await this.service.gradeSubmission(submissionId, req.profileId!, req.body);
      sendResponse(res, 200, 'Berhasil menilai tugas', data);
    } catch (error) {
      next(error);
    }
  };

  bulkGrade = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('teacher') || !req.profileId)) {
        throw new SentriError('FORBIDDEN', 'Hanya Guru yang dapat menilai tugas', 403);
      }

      const data = await this.service.bulkGradeSubmissions(req.profileId!, req.body);
      sendResponse(res, 200, 'Nilai berhasil disimpan', data);
    } catch (error) {
      next(error);
    }
  };
}

import { assignmentSubmissionService } from '../service/assignment-submission.service';
export const assignmentSubmissionController = new AssignmentSubmissionController(assignmentSubmissionService);
