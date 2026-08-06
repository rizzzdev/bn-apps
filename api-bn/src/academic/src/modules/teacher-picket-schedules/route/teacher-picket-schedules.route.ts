import { Router } from 'express';
import { teacherPicketScheduleController } from '#academic/modules/teacher-picket-schedules/controller';
import { uploadExcel } from '#app/middlewares/upload-excel.middleware.js';

export const teacherPicketSchedulesRoute = Router();

teacherPicketSchedulesRoute.get('/', teacherPicketScheduleController.getAll);
teacherPicketSchedulesRoute.post('/', teacherPicketScheduleController.create);
teacherPicketSchedulesRoute.get('/template', teacherPicketScheduleController.downloadExcelTemplate);
teacherPicketSchedulesRoute.post('/batch', teacherPicketScheduleController.createBulk);
teacherPicketSchedulesRoute.post('/batch/excel', uploadExcel, teacherPicketScheduleController.bulkCreateFromExcel);
teacherPicketSchedulesRoute.delete('/batch', teacherPicketScheduleController.deleteBulk);
teacherPicketSchedulesRoute.patch('/batch/status', teacherPicketScheduleController.updateStatusBulk);
teacherPicketSchedulesRoute.get('/export', teacherPicketScheduleController.downloadExcelExport);
teacherPicketSchedulesRoute.get('/:id', teacherPicketScheduleController.getById);
teacherPicketSchedulesRoute.put('/:id', teacherPicketScheduleController.update);
teacherPicketSchedulesRoute.delete('/:id', teacherPicketScheduleController.delete);
