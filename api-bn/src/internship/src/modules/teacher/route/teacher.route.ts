import { Router } from 'express';
import { teacherController } from '@internship/modules/teacher/controller/index.js';

export const teacherRoute = Router();

teacherRoute.get('/', teacherController.getAll);
teacherRoute.get('/:id', teacherController.getById);
