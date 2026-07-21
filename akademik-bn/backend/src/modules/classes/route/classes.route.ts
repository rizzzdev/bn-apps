import { Router } from 'express';
import { classController } from '@/modules/classes/controller';

export const classesRoute = Router();

classesRoute.get('/', classController.getAll);
classesRoute.get('/:id', classController.getById);
