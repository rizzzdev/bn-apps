import { Request, Response, NextFunction } from 'express';
import { AssessmentScoreService, assessmentScoreService } from '#internship/modules/assessment-score/service/index.js';
import { sendResponse } from '#app';

export class AssessmentScoreController {
  constructor(private service: AssessmentScoreService) {}

  getByPlacementId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { placementId } = req.query;
      if (!placementId) throw new Error('placementId wajib diisi');
      const data = await this.service.getByPlacementId(placementId as string);
      sendResponse(res, 200, 'Berhasil mengambil data skor', data);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getById(req.params.id as string);
      sendResponse(res, 200, 'Berhasil mengambil data skor', data);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      const data = await this.service.create(req.body, actorId);
      sendResponse(res, 201, 'Berhasil menambahkan skor', data);
    } catch (error) {
      next(error);
    }
  };

  upsert = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      const data = await this.service.upsert(req.body, actorId);
      sendResponse(res, 200, 'Berhasil menyimpan skor', data);
    } catch (error) {
      next(error);
    }
  };

  bulkSubmit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      const data = await this.service.bulkSubmit(req.body, actorId);
      sendResponse(res, 200, 'Berhasil menyimpan semua skor', data);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      const data = await this.service.update(req.params.id as string, req.body, actorId);
      sendResponse(res, 200, 'Berhasil memperbarui skor', data);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      await this.service.delete(req.params.id as string, actorId);
      sendResponse(res, 200, 'Berhasil menghapus skor');
    } catch (error) {
      next(error);
    }
  };
}

export const assessmentScoreController = new AssessmentScoreController(assessmentScoreService);
