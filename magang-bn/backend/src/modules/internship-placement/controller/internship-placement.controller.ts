import { Request, Response, NextFunction } from 'express';
import { InternshipPlacementService, internshipPlacementService } from '@/modules/internship-placement/service/index.js';
import { sendResponse } from '@/utils/response.js';

export class InternshipPlacementController {
  constructor(private service: InternshipPlacementService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const studentId = req.query.studentId as string;
      const mentorId = req.query.mentorId as string;
      const teacherId = req.query.teacherId as string;
      const status = req.query.status as string;
      const companyId = req.query.companyId as string;
      const { data, total } = await this.service.getAll(page, limit, search, studentId, mentorId, teacherId, status, companyId);
      
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

  bulkCreate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      const data = await this.service.bulkCreate(req.body, actorId);
      sendResponse(res, 201, `Berhasil menambahkan ${data.count} penempatan magang`);
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
  bulkDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      const result = await this.service.bulkDelete(req.body.ids, actorId);
      sendResponse(res, 200, `Berhasil menghapus ${result.count} data`);
    } catch (error) {
      next(error);
    }
  };
  bulkUpdateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      const result = await this.service.bulkUpdateStatus(req.body, actorId);
      sendResponse(res, 200, `Berhasil memperbarui status ${result.count} data`);
    } catch (error) {
      next(error);
    }
  };
  bulkUpdateAssessable = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      const result = await this.service.bulkUpdateAssessable(req.body, actorId);
      sendResponse(res, 200, `Berhasil memperbarui akses nilai ${result.count} data`);
    } catch (error) {
      next(error);
    }
  };

  updateCertificate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.user?.id;
      const { certificateUrl } = req.body;
      const data = await this.service.updateCertificate(req.params.id as string, certificateUrl, actorId);
      sendResponse(res, 200, 'Berhasil memperbarui sertifikat', data);
    } catch (error) {
      next(error);
    }
  };
}

export const internshipPlacementController = new InternshipPlacementController(internshipPlacementService);
