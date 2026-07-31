import { Request, Response, NextFunction } from 'express';
import { AssessmentIndicatorService, assessmentIndicatorService } from '@internship/modules/assessment-indicator/service/index.js';
import { sendResponse } from '@app/index.js';

export class AssessmentIndicatorController {
  constructor(private service: AssessmentIndicatorService) {}

  getByPlacementId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { placementId } = req.query;
      if (!placementId) throw new Error('placementId wajib diisi');
      const data = await this.service.getByPlacementId(placementId as string);
      sendResponse(res, 200, 'Berhasil mengambil data indikator', data);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getById(req.params.id as string);
      sendResponse(res, 200, 'Berhasil mengambil data indikator', data);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.create(req.body);
      sendResponse(res, 201, 'Berhasil menambahkan indikator', data);
    } catch (error) {
      next(error);
    }
  };

  bulkCreate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.bulkCreate(req.body);
      sendResponse(res, 201, 'Berhasil menambahkan indikator secara bulk', data);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.update(req.params.id as string, req.body);
      sendResponse(res, 200, 'Berhasil memperbarui indikator', data);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.params.id as string);
      sendResponse(res, 200, 'Berhasil menghapus indikator');
    } catch (error) {
      next(error);
    }
  };

  bulkDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.bulkDelete(req.body.ids);
      sendResponse(res, 200, `Berhasil menghapus ${result.count} indikator`);
    } catch (error) {
      next(error);
    }
  };
}

export const assessmentIndicatorController = new AssessmentIndicatorController(assessmentIndicatorService);
