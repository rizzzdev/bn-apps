import { Router } from 'express';
import { lessonHourController } from '@/modules/lesson-hours/controller';
import { validate } from '@/middlewares/validate';
import { createLessonHourSchema, updateLessonHourSchema } from '@/modules/lesson-hours/domain';

export const lessonHoursRoute = Router();

lessonHoursRoute.get('/', lessonHourController.getAll);
lessonHoursRoute.post('/', validate(createLessonHourSchema), lessonHourController.create);
lessonHoursRoute.delete('/bulk', lessonHourController.deleteBulk);
lessonHoursRoute.patch('/bulk/status', lessonHourController.updateStatusBulk);
lessonHoursRoute.get('/:id', lessonHourController.getById);
lessonHoursRoute.patch('/:id', validate(updateLessonHourSchema), lessonHourController.update);
lessonHoursRoute.delete('/:id', lessonHourController.delete);
