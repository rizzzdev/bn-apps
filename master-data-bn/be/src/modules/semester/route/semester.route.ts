import { validate } from '@/middlewares';
import { Router } from 'express';
import { semesterController } from '@/modules/semester/controller';
import { batchGetSemesterSchema, createSemesterSchema, updateSemesterSchema } from '@/modules/semester/domain';
import { z } from 'zod';

export const semesterRoute = Router();

semesterRoute.post('/batch', validate(batchGetSemesterSchema), semesterController.getBatch);
semesterRoute.delete('/bulk', validate(z.object({ ids: z.array(z.string().min(1)).min(1) })), semesterController.bulkDelete);

semesterRoute.get('/', semesterController.getAll);
semesterRoute.get('/:id', semesterController.getById);
semesterRoute.post('/', validate(createSemesterSchema), semesterController.create);
semesterRoute.put('/:id', validate(updateSemesterSchema), semesterController.update);
semesterRoute.delete('/:id', semesterController.delete);
