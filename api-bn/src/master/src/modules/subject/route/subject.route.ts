import { validate, uploadExcel } from '@master/middlewares';
import { Router } from 'express';
import { subjectController } from '@master/modules/subject/controller';
import { batchGetSubjectSchema, createSubjectSchema, updateSubjectSchema } from '@master/modules/subject/domain';
import { z } from 'zod';

export const subjectRoute = Router();

// Template route didefinisikan sebelum `/:id`
subjectRoute.get('/template', subjectController.downloadTemplate);

// Batch routes — didefinisikan sebelum `/:id`
subjectRoute.post('/batch/get', validate(batchGetSubjectSchema), subjectController.getBatch);
subjectRoute.post('/batch/delete', validate(z.object({ ids: z.array(z.string().min(1)).min(1) })), subjectController.bulkDelete);
subjectRoute.post('/batch/excel', uploadExcel, subjectController.bulkCreate);

// CRUD routes
subjectRoute.get('/', subjectController.getAll);
subjectRoute.get('/:id', subjectController.getById);
subjectRoute.post('/', validate(createSubjectSchema), subjectController.create);
subjectRoute.put('/:id', validate(updateSubjectSchema), subjectController.update);
subjectRoute.delete('/:id', subjectController.delete);
