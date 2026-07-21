import { Router } from 'express';
import { teacherPicketScheduleController } from '@/modules/teacher-picket-schedules/controller';

export const teacherPicketSchedulesRoute = Router();

teacherPicketSchedulesRoute.get('/', teacherPicketScheduleController.getAll);
teacherPicketSchedulesRoute.post('/', teacherPicketScheduleController.create);
teacherPicketSchedulesRoute.post('/bulk', teacherPicketScheduleController.createBulk);
teacherPicketSchedulesRoute.delete('/bulk', teacherPicketScheduleController.deleteBulk);
teacherPicketSchedulesRoute.patch('/bulk/status', teacherPicketScheduleController.updateStatusBulk);
teacherPicketSchedulesRoute.get('/:id', teacherPicketScheduleController.getById);
teacherPicketSchedulesRoute.patch('/:id', teacherPicketScheduleController.update);
teacherPicketSchedulesRoute.delete('/:id', teacherPicketScheduleController.delete);
