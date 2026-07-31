import { validate, uploadExcel } from '@/middlewares';
import { Router } from 'express';
import { subjectController } from '@/modules/subject/controller';
import { batchGetSubjectSchema, createSubjectSchema, updateSubjectSchema } from '@/modules/subject/domain';
import { z } from 'zod';

export const subjectRoute = Router();

subjectRoute.get('/template', subjectController.downloadTemplate);
subjectRoute.post('/bulk', uploadExcel, subjectController.bulkCreate);

subjectRoute.post('/batch', validate(batchGetSubjectSchema), subjectController.getBatch);
subjectRoute.delete('/bulk', validate(z.object({ ids: z.array(z.string().min(1)).min(1) })), subjectController.bulkDelete);

subjectRoute.get('/', subjectController.getAll);
subjectRoute.get('/:id', subjectController.getById);
subjectRoute.post('/', validate(createSubjectSchema), subjectController.create);
subjectRoute.put('/:id', validate(updateSubjectSchema), subjectController.update);
subjectRoute.delete('/:id', subjectController.delete);
