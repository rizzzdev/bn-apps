import { validate, uploadExcel } from '@master/middlewares';
import { Router } from 'express';
import { classController } from '@master/modules/class/controller';
import { batchGetClassSchema, createClassSchema, updateClassSchema } from '@master/modules/class/domain';
import { z } from 'zod';

export const classRoute = Router();

// Template route didefinisikan sebelum `/:id`
classRoute.get('/template', classController.downloadTemplate);

// Batch routes — didefinisikan sebelum `/:id`
classRoute.post('/batch/get', validate(batchGetClassSchema), classController.getBatch);
classRoute.post('/batch/delete', validate(z.object({ ids: z.array(z.string().min(1)).min(1) })), classController.bulkDelete);
classRoute.post('/batch/excel', uploadExcel, classController.bulkCreate);

// CRUD routes
classRoute.get('/', classController.getAll);
classRoute.get('/:id', classController.getById);
classRoute.post('/', validate(createClassSchema), classController.create);
classRoute.put('/:id', validate(updateClassSchema), classController.update);
classRoute.delete('/:id', classController.delete);
