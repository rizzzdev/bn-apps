import { Request, Response, NextFunction } from 'express';
import { AssignmentService } from '../service/assignment.service';
import { sendResponse } from '@/utils/response';
import { SentriError } from 'sentri/core';

export class AssignmentController {
  constructor(private service: AssignmentService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('teacher') || !req.profileId)) {
        throw new SentriError('FORBIDDEN', 'Hanya Guru yang dapat membuat tugas', 403);
      }
      const data = await this.service.create(req.body, req.profileId!);
      sendResponse(res, 201, 'Tugas berhasil dibuat', data);
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.profileId) {
        throw new SentriError('FORBIDDEN', 'Hanya Guru yang dapat mengakses daftar tugas', 403);
      }
      const data = await this.service.getAll(req.profileId);
      sendResponse(res, 200, 'Berhasil mengambil daftar tugas', data);
    } catch (error) {
      next(error);
    }
  };

  getByClass = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { classId } = req.params as { classId: string };
      const isStudent = req.user?.roles.includes('student') ?? false;
      const studentId = isStudent ? req.profileId : undefined;
      const data = await this.service.getByClass(classId, isStudent, studentId);
      sendResponse(res, 200, 'Berhasil mengambil tugas kelas', data);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as { id: string };
      const data = await this.service.getById(id);
      sendResponse(res, 200, 'Berhasil mengambil detail tugas', data);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('teacher') || !req.profileId)) {
        throw new SentriError('FORBIDDEN', 'Hanya Guru yang dapat mengubah tugas', 403);
      }
      const { id } = req.params as { id: string };
      const data = await this.service.update(id, req.body, req.profileId!);
      sendResponse(res, 200, 'Tugas berhasil diperbarui', data);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('teacher') || !req.profileId)) {
        throw new SentriError('FORBIDDEN', 'Hanya Guru yang dapat menghapus tugas', 403);
      }
      const { id } = req.params as { id: string };
      await this.service.delete(id, req.profileId!);
      sendResponse(res, 200, 'Tugas berhasil dihapus');
    } catch (error) {
      next(error);
    }
  };

  bulkDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('teacher') || !req.profileId)) {
        throw new SentriError('FORBIDDEN', 'Hanya Guru yang dapat menghapus tugas', 403);
      }
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids)) {
        throw new SentriError('BAD_REQUEST', 'IDs tidak valid', 400);
      }
      await this.service.bulkDelete(ids, req.profileId!);
      sendResponse(res, 200, 'Tugas berhasil dihapus secara massal');
    } catch (error) {
      next(error);
    }
  };
}

import { assignmentService } from '../service/assignment.service';
export const assignmentController = new AssignmentController(assignmentService);
