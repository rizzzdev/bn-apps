import { Request, Response, NextFunction } from 'express';
import { AssessmentService, assessmentService } from '@/modules/assessment/service/index.js';
import { sendResponse } from '@/utils/response.js';

export class AssessmentController {
  constructor(private service: AssessmentService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { data, total } = await this.service.getAll(page, limit);
      
      const pagination = {
        currentPage: page,
        totalPage: Math.ceil(total / limit),
        totalData: total,
        dataPerPage: limit,
      };

      sendResponse(res, 200, 'Berhasil mengambil data', data, pagination);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getById((req.params.id as string));
      sendResponse(res, 200, 'Berhasil mengambil data', data);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      const data = await this.service.create(req.body, actorId);
      sendResponse(res, 201, 'Berhasil ditambahkan', data);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      const data = await this.service.update((req.params.id as string), req.body, actorId);
      sendResponse(res, 200, 'Berhasil diperbarui', data);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      await this.service.delete((req.params.id as string), actorId);
      sendResponse(res, 200, 'Berhasil dihapus');
    } catch (error) {
      next(error);
    }
  };

  updateCertificate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      const { attachmentId } = req.body;
      if (!attachmentId) throw new Error('attachmentId wajib diisi');
      const data = await this.service.updateCertificate(req.params.id as string, attachmentId, actorId);
      sendResponse(res, 200, 'Berhasil memperbarui sertifikat', data);
    } catch (error) {
      next(error);
    }
  };

  removeCertificate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      await this.service.removeCertificate(req.params.id as string, actorId);
      sendResponse(res, 200, 'Berhasil menghapus sertifikat');
    } catch (error) {
      next(error);
    }
  };

  bulkDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.bulkDelete(req.body.ids);
      sendResponse(res, 200, `Berhasil menghapus ${result.count} data`);
    } catch (error) {
      next(error);
    }
  };
}

export const assessmentController = new AssessmentController(assessmentService);
