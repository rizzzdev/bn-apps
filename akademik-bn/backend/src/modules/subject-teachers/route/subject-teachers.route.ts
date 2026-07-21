import { Router } from 'express';
import { subjectTeacherController } from '@/modules/subject-teachers/controller';

export const subjectTeachersRoute = Router();

subjectTeachersRoute.get('/', subjectTeacherController.getAll);
subjectTeachersRoute.post('/', subjectTeacherController.create);
subjectTeachersRoute.delete('/bulk', subjectTeacherController.deleteBulk);
subjectTeachersRoute.patch('/bulk/status', subjectTeacherController.updateStatusBulk);
subjectTeachersRoute.get('/:id', subjectTeacherController.getById);
subjectTeachersRoute.patch('/:id', subjectTeacherController.update);
subjectTeachersRoute.delete('/:id', subjectTeacherController.delete);
