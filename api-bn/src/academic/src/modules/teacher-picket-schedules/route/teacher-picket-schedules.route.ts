import { Router } from 'express';
import { teacherPicketScheduleController } from '@academic/modules/teacher-picket-schedules/controller';

export const teacherPicketSchedulesRoute = Router();

teacherPicketSchedulesRoute.get('/', teacherPicketScheduleController.getAll);
teacherPicketSchedulesRoute.post('/', teacherPicketScheduleController.create);
teacherPicketSchedulesRoute.post('/batch', teacherPicketScheduleController.createBulk);
teacherPicketSchedulesRoute.delete('/batch', teacherPicketScheduleController.deleteBulk);
teacherPicketSchedulesRoute.patch('/batch/status', teacherPicketScheduleController.updateStatusBulk);
teacherPicketSchedulesRoute.get('/:id', teacherPicketScheduleController.getById);
teacherPicketSchedulesRoute.patch('/:id', teacherPicketScheduleController.update);
teacherPicketSchedulesRoute.delete('/:id', teacherPicketScheduleController.delete);
