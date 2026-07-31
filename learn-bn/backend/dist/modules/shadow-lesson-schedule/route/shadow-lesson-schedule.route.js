import { Router } from 'express';
import { lessonScheduleController } from '../controller';
export const lessonScheduleRoute = Router();
lessonScheduleRoute.get('/', lessonScheduleController.getAll);
lessonScheduleRoute.get('/student', lessonScheduleController.getByStudent);
lessonScheduleRoute.get('/student/:studentId', lessonScheduleController.getByStudent);
