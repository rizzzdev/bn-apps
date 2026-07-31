import { Request, Response, NextFunction } from 'express';
import { QuizService } from '../service/quiz.service';
import { sendResponse } from '@app/index.js';
import { SentriError } from 'sentri/core';

const ensureTeacherOrAdmin = (req: Request) => {
  if (!req.user?.roles.includes('super_admin') && (!req.user?.roles.includes('teacher') || !req.profileId)) {
    throw new SentriError('FORBIDDEN', 'Hanya Guru yang diizinkan', 403);
  }
};

export class QuizController {
  constructor(private service: QuizService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      ensureTeacherOrAdmin(req);
      const data = await this.service.create(req.body, req.profileId!);
      sendResponse(res, 201, 'Kuis berhasil dibuat', data);
    } catch (error) { next(error); }
  };

  // --- Batch operations (standar) ---

  bulkCreate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      ensureTeacherOrAdmin(req);
      const data = await this.service.bulkCreate(req.body, req.profileId!);
      sendResponse(res, 201, 'Kuis berhasil dibuat untuk kelas terdaftar', { count: Array.isArray(data) ? data.length : 0, items: data });
    } catch (error) { next(error); }
  };

  bulkDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      ensureTeacherOrAdmin(req);
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids)) {
        throw new SentriError('BAD_REQUEST', 'IDs tidak valid', 400);
      }
      await this.service.bulkDelete(ids, req.profileId!);
      sendResponse(res, 200, `Berhasil menghapus ${ids.length} kuis`, { count: ids.length });
    } catch (error) { next(error); }
  };

  // --- Single resource ops ---

  getByClass = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { classId } = req.params as { classId: string };
      const role = req.user?.roles[0];
      const data = await this.service.getByClass(classId, role);
      sendResponse(res, 200, 'Berhasil mengambil kuis kelas', data);
    } catch (error) { next(error); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new SentriError('UNAUTHORIZED', 'Belum login', 401);
      const { id } = req.params as { id: string };
      const role = req.user.roles[0];
      const data = await this.service.getById(id, role);
      sendResponse(res, 200, 'Berhasil mengambil detail kuis', data);
    } catch (error) { next(error); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      ensureTeacherOrAdmin(req);
      const { id } = req.params as { id: string };
      const data = await this.service.update(id, req.body, req.profileId!);
      sendResponse(res, 200, 'Kuis berhasil diperbarui', data);
    } catch (error) { next(error); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      ensureTeacherOrAdmin(req);
      const { id } = req.params as { id: string };
      await this.service.delete(id, req.profileId!);
      sendResponse(res, 200, 'Kuis berhasil dihapus', null);
    } catch (error) { next(error); }
  };
}

import { quizService } from '../service/quiz.service';
export const quizController = new QuizController(quizService);
