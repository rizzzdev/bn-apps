import { Router } from 'express';
import { classController } from '../controller';
export const classRoute = Router();
classRoute.get('/', classController.getAll);
classRoute.get('/teacher', classController.getByTeacher);
classRoute.get('/student', classController.getByStudent);
classRoute.get('/:classId/students', classController.getStudents);
