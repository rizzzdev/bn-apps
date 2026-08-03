import { Router } from 'express';
import { majorHeadController } from '@academic/modules/major-heads/controller';

export const majorHeadsRoute = Router();

majorHeadsRoute.get('/', majorHeadController.getAll);
majorHeadsRoute.post('/assign', majorHeadController.assignHead);
majorHeadsRoute.post('/', majorHeadController.create);
majorHeadsRoute.delete('/batch', majorHeadController.deleteBulk);
majorHeadsRoute.patch('/batch/status', majorHeadController.updateStatusBulk);
majorHeadsRoute.get('/:id', majorHeadController.getById);
majorHeadsRoute.put('/:id', majorHeadController.update);
majorHeadsRoute.delete('/:id', majorHeadController.delete);
