import { Router } from 'express';
import { academicYearController } from '@/modules/academic-years/controller';

export const academicYearsRoute = Router();

academicYearsRoute.get('/', academicYearController.getAll);
academicYearsRoute.get('/:id', academicYearController.getById);
