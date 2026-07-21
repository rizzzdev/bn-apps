import { Router } from 'express';
import { lessonScheduleController } from '@/modules/lesson-schedules/controller';
import { validate } from '@/middlewares/validate';
import {
  createLessonScheduleSchema,
  updateLessonScheduleSchema,
} from '@/modules/lesson-schedules/domain';

export const lessonSchedulesRoute = Router();

lessonSchedulesRoute.get('/', lessonScheduleController.getAll);
lessonSchedulesRoute.post('/', validate(createLessonScheduleSchema), lessonScheduleController.create);
lessonSchedulesRoute.post('/bulk', lessonScheduleController.createBulk);
lessonSchedulesRoute.delete('/bulk', lessonScheduleController.deleteBulk);
lessonSchedulesRoute.patch('/bulk/status', lessonScheduleController.updateStatusBulk);
lessonSchedulesRoute.get('/:id', lessonScheduleController.getById);
lessonSchedulesRoute.patch('/:id', validate(updateLessonScheduleSchema), lessonScheduleController.update);
lessonSchedulesRoute.delete('/:id', lessonScheduleController.delete);
