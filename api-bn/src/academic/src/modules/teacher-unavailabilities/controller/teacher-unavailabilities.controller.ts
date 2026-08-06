import type { Request, Response, NextFunction } from 'express';
import { teacherUnavailabilityService } from '../service';
import { sendResponse, createDownloadTemplateHandler, createUploadExcelHandler } from '#app';

export class TeacherUnavailabilityController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const teacherId = req.query.teacherId as string | undefined;
      const data = await teacherUnavailabilityService.getAll(teacherId);
      sendResponse(res, 200, 'Berhasil mengambil data ketersediaan guru', data);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await teacherUnavailabilityService.create(req.body);
      sendResponse(res, 201, 'Berhasil menambahkan ketidaktersediaan guru', data);
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await teacherUnavailabilityService.delete(id);
      sendResponse(res, 200, 'Berhasil menghapus ketidaktersediaan guru', null);
    } catch (err) {
      next(err);
    }
  }

  // --- Batch operations (standar) ---

  async bulkSet(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await teacherUnavailabilityService.bulkSet(req.body);
      sendResponse(res, 200, 'Berhasil memperbarui ketidaktersediaan guru', data);
    } catch (err) {
      next(err);
    }
  }

  async bulkDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body as { ids: string[] };
      const result = await teacherUnavailabilityService.bulkDelete(ids);
      sendResponse(
        res,
        200,
        `Berhasil menghapus ${ids.length} ketidaktersediaan guru`,
        { count: typeof result === 'number' ? result : ids.length },
      );
    } catch (err) {
      next(err);
    }
  }

  bulkCreateFromExcel = createUploadExcelHandler(
    (buffer) => teacherUnavailabilityService.bulkCreateFromExcel(buffer),
  );

  downloadExcelTemplate = createDownloadTemplateHandler(
    'teacher_unavailabilities_template.xlsx',
    () => teacherUnavailabilityService.getExcelTemplate(),
  );

  downloadExcelExport = createDownloadTemplateHandler(
    'teacher_unavailabilities_export.xlsx',
    () => teacherUnavailabilityService.getExcelExport(),
  );
}

export const teacherUnavailabilityController = new TeacherUnavailabilityController();
