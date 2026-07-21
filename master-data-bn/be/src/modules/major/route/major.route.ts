import { validate } from '@/middlewares';
import { Router } from 'express';
import { majorController } from '@/modules/major/controller';
import { batchGetMajorSchema, createMajorSchema, updateMajorSchema } from '@/modules/major/domain';
import { z } from 'zod';

export const majorRoute = Router();

majorRoute.post('/batch', validate(batchGetMajorSchema), majorController.getBatch);
majorRoute.delete('/bulk', validate(z.object({ ids: z.array(z.string().min(1)).min(1) })), majorController.bulkDelete);

majorRoute.get('/', majorController.getAll);
majorRoute.get('/:id', majorController.getById);
majorRoute.post('/', validate(createMajorSchema), majorController.create);
majorRoute.put('/:id', validate(updateMajorSchema), majorController.update);
majorRoute.delete('/:id', majorController.delete);
