import { Router } from 'express';
import { studentController } from '#internship/modules/student/controller/index.js';

export const studentRoute = Router();

studentRoute.get('/', studentController.getAll);
studentRoute.get('/:id', studentController.getById);
