import { Router } from 'express';
import { majorController } from '@/modules/majors/controller';

export const majorsRoute = Router();

majorsRoute.get('/', majorController.getAll);
majorsRoute.get('/:id', majorController.getById);
