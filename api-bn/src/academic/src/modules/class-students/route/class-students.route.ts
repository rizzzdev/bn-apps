import { Router } from 'express';
import { classStudentController } from '#academic/modules/class-students/controller';
import { uploadExcel } from '#app/middlewares/upload-excel.middleware.js';

export const classStudentsRoute = Router();

classStudentsRoute.get('/', classStudentController.getAll);
classStudentsRoute.post('/', classStudentController.create);
classStudentsRoute.get('/template', classStudentController.downloadExcelTemplate);
classStudentsRoute.post('/batch', classStudentController.createBulk);
classStudentsRoute.post('/batch/excel', uploadExcel, classStudentController.bulkCreateFromExcel);
classStudentsRoute.post('/promote', classStudentController.promote);
classStudentsRoute.post('/hold', classStudentController.hold);
classStudentsRoute.post('/transfer', classStudentController.transfer);
classStudentsRoute.post('/graduate', classStudentController.graduate);
classStudentsRoute.delete('/batch', classStudentController.deleteBulk);
classStudentsRoute.patch('/batch/status', classStudentController.updateStatusBulk);
classStudentsRoute.get('/export', classStudentController.downloadExcelExport);
classStudentsRoute.get('/:id', classStudentController.getById);
classStudentsRoute.put('/:id', classStudentController.update);
classStudentsRoute.delete('/:id', classStudentController.delete);
