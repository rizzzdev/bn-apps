import { Router } from 'express';
import { homeroomTeacherController } from '@academic/modules/homeroom-teachers/controller';

export const homeroomTeachersRoute = Router();

homeroomTeachersRoute.get('/', homeroomTeacherController.getAll);
homeroomTeachersRoute.post('/', homeroomTeacherController.create);
homeroomTeachersRoute.delete('/batch', homeroomTeacherController.deleteBulk);
homeroomTeachersRoute.patch('/batch/status', homeroomTeacherController.updateStatusBulk);
homeroomTeachersRoute.get('/:id', homeroomTeacherController.getById);
homeroomTeachersRoute.patch('/:id', homeroomTeacherController.update);
homeroomTeachersRoute.delete('/:id', homeroomTeacherController.delete);
