import { Router } from 'express';
import { academicYearController } from '../controller';
export const academicYearRoute = Router();
academicYearRoute.get('/', academicYearController.getAll);
