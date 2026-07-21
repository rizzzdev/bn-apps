import { validate } from '@/middlewares';
import { Router } from 'express';
import { classController } from '@/modules/class/controller';
import { batchGetClassSchema, createClassSchema, updateClassSchema } from '@/modules/class/domain';
import { z } from 'zod';

export const classRoute = Router();

classRoute.post('/batch', validate(batchGetClassSchema), classController.getBatch);
classRoute.delete('/bulk', validate(z.object({ ids: z.array(z.string().min(1)).min(1) })), classController.bulkDelete);

classRoute.get('/', classController.getAll);
classRoute.get('/:id', classController.getById);
classRoute.post('/', validate(createClassSchema), classController.create);
classRoute.put('/:id', validate(updateClassSchema), classController.update);
classRoute.delete('/:id', classController.delete);
