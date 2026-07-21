import { Router } from 'express';
import { teacherController } from '@/modules/teachers/controller';

export const teachersRoute = Router();

teachersRoute.get('/', teacherController.getAll);
teachersRoute.get('/:id', teacherController.getById);
