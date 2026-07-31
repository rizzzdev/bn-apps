import { Router } from 'express';
import { subjectTeacherController } from '../controller';
export const subjectTeacherRoute = Router();
subjectTeacherRoute.get('/', subjectTeacherController.getAll);
