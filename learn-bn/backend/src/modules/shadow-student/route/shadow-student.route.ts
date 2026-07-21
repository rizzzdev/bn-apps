import { Router } from 'express';
import { studentController } from '../controller';

export const studentRoute = Router();

studentRoute.get('/', studentController.getAll);
