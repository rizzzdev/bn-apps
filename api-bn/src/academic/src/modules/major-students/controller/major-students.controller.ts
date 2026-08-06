import type { Request, Response, NextFunction } from 'express';
import { MajorStudentService, majorStudentsService } from '#academic/modules/major-students/service';
import { sendResponse, createDownloadTemplateHandler, createUploadExcelHandler } from '#app';
import { BaseController } from '#academic/utils/index.js';

export class MajorStudentController extends BaseController<any, any, any> {
  constructor(protected service: MajorStudentService) {
    super(service);
  }



  transfer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentIds } = req.body as { studentIds: string[] };
      const result = await this.service.transfer(studentIds);
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

  bulkCreateFromExcel = createUploadExcelHandler(
    (buffer) => this.service.bulkCreateFromExcel(buffer),
  );

  downloadExcelTemplate = createDownloadTemplateHandler(
    'major_students_template.xlsx',
    () => this.service.getExcelTemplate(),
  );

  downloadExcelExport = createDownloadTemplateHandler(
    'major_students_export.xlsx',
    () => this.service.getExcelExport(),
  );
}

export const majorStudentController = new MajorStudentController(majorStudentsService);
