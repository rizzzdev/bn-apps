import { validate, uploadExcel } from '#master/middlewares';
import { Router } from 'express';
import { applicationController } from '#master/modules/application/controller';
import { batchGetApplicationSchema, createApplicationSchema, updateApplicationSchema } from '#master/modules/application/domain';
import { z } from 'zod';

export const applicationRoute = Router();

// Template route didefinisikan sebelum `/:id`
applicationRoute.get('/template', applicationController.downloadTemplate);

// Batch routes — didefinisikan sebelum `/:id`
applicationRoute.post('/batch/get', validate(batchGetApplicationSchema), applicationController.getBatch);
applicationRoute.post('/batch/delete', validate(z.object({ ids: z.array(z.string().min(1)).min(1) })), applicationController.bulkDelete);
applicationRoute.post('/batch/excel', uploadExcel, applicationController.bulkCreate);

// CRUD routes
applicationRoute.get('/', applicationController.getAll);
applicationRoute.get('/:id', applicationController.getById);
applicationRoute.post('/', validate(createApplicationSchema), applicationController.create);
applicationRoute.put('/:id', validate(updateApplicationSchema), applicationController.update);
applicationRoute.delete('/:id', applicationController.delete);
