import type { Request, Response, NextFunction } from 'express';
import { classSubjectRequirementService } from '../service';
import { sendResponse } from '#app';

export class ClassSubjectRequirementController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters: { classId?: string; subjectId?: string; teacherId?: string } = {};
      if (typeof req.query.classId === 'string' && req.query.classId) filters.classId = req.query.classId;
      if (typeof req.query.subjectId === 'string' && req.query.subjectId) filters.subjectId = req.query.subjectId;
      if (typeof req.query.teacherId === 'string' && req.query.teacherId) filters.teacherId = req.query.teacherId;

      const data = await classSubjectRequirementService.getAll(filters);
      sendResponse(res, 200, 'Berhasil mengambil data kebutuhan jam pelajaran', data);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await classSubjectRequirementService.getById(id);
      sendResponse(res, 200, 'Berhasil mengambil data kebutuhan jam pelajaran', data);
    } catch (err) {
      next(err);
    }
  }

  async upsert(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await classSubjectRequirementService.upsert(req.body);
      sendResponse(res, 200, 'Berhasil memperbarui kebutuhan jam pelajaran', data);
    } catch (err) {
      next(err);
    }
  }

  async bulkUpsert(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await classSubjectRequirementService.bulkUpsert(req.body);
      sendResponse(res, 200, 'Berhasil memperbarui masal kebutuhan jam pelajaran', data);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await classSubjectRequirementService.update(id, req.body);
      sendResponse(res, 200, 'Berhasil memperbarui data kebutuhan jam pelajaran', data);
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await classSubjectRequirementService.delete(id);
      sendResponse(res, 200, 'Berhasil menghapus data kebutuhan jam pelajaran');
    } catch (err) {
      next(err);
    }
  }

  async bulkDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body as { ids: string[] };
      const result = await classSubjectRequirementService.bulkDelete(ids);
      sendResponse(res, 200, 'Berhasil menghapus data kebutuhan jam pelajaran secara massal', result);
    } catch (err) {
      next(err);
    }
  }

  async clearAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await classSubjectRequirementService.clearAll();
      sendResponse(res, 200, 'Berhasil menghapus semua data alokasi jam pelajaran', result);
    } catch (err) {
      next(err);
    }
  }
}

export const classSubjectRequirementController = new ClassSubjectRequirementController();
