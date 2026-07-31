import { validate, uploadExcel } from '@master/middlewares';
import { Router } from 'express';
import { majorController } from '@master/modules/major/controller';
import { batchGetMajorSchema, createMajorSchema, updateMajorSchema } from '@master/modules/major/domain';
import { z } from 'zod';

export const majorRoute = Router();

// Template route didefinisikan sebelum `/:id`
majorRoute.get('/template', majorController.downloadTemplate);

// Batch routes — didefinisikan sebelum `/:id`
majorRoute.post('/batch/get', validate(batchGetMajorSchema), majorController.getBatch);
majorRoute.post('/batch/delete', validate(z.object({ ids: z.array(z.string().min(1)).min(1) })), majorController.bulkDelete);
majorRoute.post('/batch/excel', uploadExcel, majorController.bulkCreate);

// CRUD routes
majorRoute.get('/', majorController.getAll);
majorRoute.get('/:id', majorController.getById);
majorRoute.post('/', validate(createMajorSchema), majorController.create);
majorRoute.put('/:id', validate(updateMajorSchema), majorController.update);
majorRoute.delete('/:id', majorController.delete);
