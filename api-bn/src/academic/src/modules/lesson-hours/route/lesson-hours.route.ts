import { Router } from 'express';
import { lessonHourController } from '@academic/modules/lesson-hours/controller';
import { validate } from '@academic/middlewares/validate';
import { createLessonHourSchema, updateLessonHourSchema } from '@academic/modules/lesson-hours/domain';

export const lessonHoursRoute = Router();

lessonHoursRoute.get('/', lessonHourController.getAll);
lessonHoursRoute.post('/', validate(createLessonHourSchema), lessonHourController.create);
lessonHoursRoute.delete('/batch', lessonHourController.deleteBulk);
lessonHoursRoute.patch('/batch/status', lessonHourController.updateStatusBulk);
lessonHoursRoute.get('/:id', lessonHourController.getById);
lessonHoursRoute.put('/:id', validate(updateLessonHourSchema), lessonHourController.update);
lessonHoursRoute.delete('/:id', lessonHourController.delete);
