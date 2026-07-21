import { Router } from 'express';
import { majorHeadController } from '@/modules/major-heads/controller';

export const majorHeadsRoute = Router();

majorHeadsRoute.get('/', majorHeadController.getAll);
majorHeadsRoute.post('/assign', majorHeadController.assignHead);
majorHeadsRoute.post('/', majorHeadController.create);
majorHeadsRoute.delete('/bulk', majorHeadController.deleteBulk);
majorHeadsRoute.patch('/bulk/status', majorHeadController.updateStatusBulk);
majorHeadsRoute.get('/:id', majorHeadController.getById);
majorHeadsRoute.patch('/:id', majorHeadController.update);
majorHeadsRoute.delete('/:id', majorHeadController.delete);
