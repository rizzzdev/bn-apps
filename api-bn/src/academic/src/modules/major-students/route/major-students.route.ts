import { Router } from 'express';
import { majorStudentController } from '#academic/modules/major-students/controller';
import { uploadExcel } from '#app/middlewares/upload-excel.middleware.js';

export const majorStudentsRoute = Router();

majorStudentsRoute.get('/', majorStudentController.getAll);
majorStudentsRoute.post('/', majorStudentController.create);
majorStudentsRoute.get('/template', majorStudentController.downloadExcelTemplate);
majorStudentsRoute.post('/batch', majorStudentController.createBulk);
majorStudentsRoute.post('/batch/excel', uploadExcel, majorStudentController.bulkCreateFromExcel);
majorStudentsRoute.post('/transfer', majorStudentController.transfer);
majorStudentsRoute.post('/graduate', majorStudentController.graduate);
majorStudentsRoute.delete('/batch', majorStudentController.deleteBulk);
majorStudentsRoute.patch('/batch/status', majorStudentController.updateStatusBulk);
majorStudentsRoute.get('/export', majorStudentController.downloadExcelExport);
majorStudentsRoute.get('/:id', majorStudentController.getById);
majorStudentsRoute.put('/:id', majorStudentController.update);
majorStudentsRoute.delete('/:id', majorStudentController.delete);
