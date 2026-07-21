import { Router } from 'express';
import { majorStudentController } from '../controller';

export const majorStudentRoute = Router();

majorStudentRoute.get('/', majorStudentController.getAll);
