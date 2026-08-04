import { Request, Response, NextFunction } from 'express';
import { ActivityService, activityService } from '#internship/modules/activity/service/index.js';
import { sendResponse } from '#app';
import { prisma } from '#internship/database/index.js';
import { Prisma } from '#internship/database/index.js';

export class ActivityController {
  constructor(private service: ActivityService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const placementId = req.query.placementId as string;
      const mentorId = req.query.mentorId as string;
      const teacherId = req.query.teacherId as string;
      const action = req.query.action as string;
      
      const whereClause: Record<string, unknown> = {};

      if (action) whereClause.action = action;

      if (placementId || mentorId || teacherId) {
        let targetUserId: string | undefined;
        // resolve userId based on the id provided by frontend
        if (placementId) {
          const p = await prisma.internshipPlacement.findUnique({ where: { id: placementId }, include: { student: true } });
          if (p?.student?.userId) targetUserId = p.student.userId;
        } else if (mentorId) {
          const m = await prisma.industryMentor.findUnique({ where: { id: mentorId } });
          if (m?.userId) targetUserId = m.userId;
        } else if (teacherId) {
          const t = await prisma.teacher.findUnique({ where: { id: teacherId } });
          if (t?.userId) targetUserId = t.userId;
        }

        if (targetUserId) {
          whereClause.OR = [
            { actorId: targetUserId, targetId: null },
            { targetId: targetUserId }
          ];
          whereClause.isForAdmin = false;
        } else {
          // If no user found, return empty result to avoid showing all activities
          whereClause.id = 'not-found';
        }
      } else {
        // If no specific role ID is passed, assume it's for Admin
        whereClause.isForAdmin = true;
      }

      const { data, total } = await this.service.getAll(page, limit, Object.keys(whereClause).length > 0 ? whereClause : undefined);
      
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
      const data = await this.service.create(req.body);
      sendResponse(res, 201, 'Berhasil ditambahkan', data);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.update((req.params.id as string), req.body);
      sendResponse(res, 200, 'Berhasil diperbarui', data);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete((req.params.id as string));
      sendResponse(res, 200, 'Berhasil dihapus');
    } catch (error) {
      next(error);
    }
  };
}

export const activityController = new ActivityController(activityService);
