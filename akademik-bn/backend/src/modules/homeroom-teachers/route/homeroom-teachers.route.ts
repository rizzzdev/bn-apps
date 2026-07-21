import { Router } from 'express';
import { homeroomTeacherController } from '@/modules/homeroom-teachers/controller';

export const homeroomTeachersRoute = Router();

homeroomTeachersRoute.get('/', homeroomTeacherController.getAll);
homeroomTeachersRoute.post('/', homeroomTeacherController.create);
homeroomTeachersRoute.delete('/bulk', homeroomTeacherController.deleteBulk);
homeroomTeachersRoute.patch('/bulk/status', homeroomTeacherController.updateStatusBulk);
homeroomTeachersRoute.get('/:id', homeroomTeacherController.getById);
homeroomTeachersRoute.patch('/:id', homeroomTeacherController.update);
homeroomTeachersRoute.delete('/:id', homeroomTeacherController.delete);
