import { Router } from 'express';
import { teacherController } from '../controller';

export const teacherRoute = Router();

teacherRoute.get('/', teacherController.getAll);
