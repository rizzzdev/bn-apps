import { Router } from 'express';
import { subjectTeacherController } from '#academic/modules/subject-teachers/controller';
import { uploadExcel } from '#app/middlewares/upload-excel.middleware.js';

export const subjectTeachersRoute = Router();

subjectTeachersRoute.get('/', subjectTeacherController.getAll);
subjectTeachersRoute.post('/', subjectTeacherController.create);
subjectTeachersRoute.get('/template', subjectTeacherController.downloadExcelTemplate);
subjectTeachersRoute.post('/batch', subjectTeacherController.createBulk);
subjectTeachersRoute.post('/batch/excel', uploadExcel, subjectTeacherController.bulkCreateFromExcel);
subjectTeachersRoute.delete('/batch', subjectTeacherController.deleteBulk);
subjectTeachersRoute.patch('/batch/status', subjectTeacherController.updateStatusBulk);
subjectTeachersRoute.patch('/batch/target-hours', subjectTeacherController.updateTargetHoursBulk);
subjectTeachersRoute.get('/export', subjectTeacherController.downloadExcelExport);
subjectTeachersRoute.get('/:id', subjectTeacherController.getById);
subjectTeachersRoute.put('/:id', subjectTeacherController.update);
subjectTeachersRoute.delete('/:id', subjectTeacherController.delete);
