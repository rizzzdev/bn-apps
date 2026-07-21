import { Router } from 'express';
import { classStudentController } from '../controller';

export const classStudentRoute = Router();

classStudentRoute.get('/', classStudentController.getAll);
