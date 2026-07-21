import { Router } from 'express';
import { studentController } from '@/modules/students/controller';

export const studentsRoute = Router();

studentsRoute.get('/', studentController.getAll);
studentsRoute.get('/:id', studentController.getById);
