import type { Request, Response, NextFunction } from 'express';
import { ClassStudentService, classStudentsService } from '@/modules/class-students/service';
import { sendResponse, BaseController } from '@/utils';

export class ClassStudentController extends BaseController<any, any, any> {
  constructor(protected service: ClassStudentService) {
    super(service);
  }



  promote = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentIds, classId } = req.body as { studentIds: string[]; classId: string };
      const result = await this.service.promote(studentIds, classId);
      sendResponse(res, 200, 'Proses kenaikan kelas selesai', result);
    } catch (error) {
      next(error);
    }
  };

  hold = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentIds, classId } = req.body as { studentIds: string[]; classId: string };
      const result = await this.service.hold(studentIds, classId);
      sendResponse(res, 200, 'Proses tinggal kelas selesai', result);
    } catch (error) {
      next(error);
    }
  };

  transfer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentIds, classId } = req.body as { studentIds: string[]; classId?: string };
      const result = await this.service.transfer(studentIds, classId);
      sendResponse(res, 200, 'Proses pindah selesai', result);
    } catch (error) {
      next(error);
    }
  };

  graduate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentIds } = req.body as { studentIds: string[] };
      const result = await this.service.graduate(studentIds);
      sendResponse(res, 200, 'Proses kelulusan selesai', result);
    } catch (error) {
      next(error);
    }
  };
}

export const classStudentController = new ClassStudentController(classStudentsService);
