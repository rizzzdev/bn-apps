import { Router } from 'express';
import { lessonScheduleController } from '#academic/modules/lesson-schedules/controller';
import { validate } from '#academic/middlewares/validate';
import {
  createLessonScheduleSchema,
  updateLessonScheduleSchema,
  createLessonSchedulesBatchSchema,
  bulkDeleteLessonSchedulesSchema,
} from '#academic/modules/lesson-schedules/domain';

export const lessonSchedulesRoute = Router();

lessonSchedulesRoute.get('/', lessonScheduleController.getAll);
lessonSchedulesRoute.post('/', validate(createLessonScheduleSchema), lessonScheduleController.create);
lessonSchedulesRoute.post('/batch', validate(createLessonSchedulesBatchSchema), lessonScheduleController.createBulk);
lessonSchedulesRoute.delete('/batch', validate(bulkDeleteLessonSchedulesSchema), lessonScheduleController.deleteBulk);
lessonSchedulesRoute.patch('/batch/status', lessonScheduleController.updateStatusBulk);
lessonSchedulesRoute.get('/:id', lessonScheduleController.getById);
lessonSchedulesRoute.put('/:id', validate(updateLessonScheduleSchema), lessonScheduleController.update);
lessonSchedulesRoute.delete('/:id', lessonScheduleController.delete);
