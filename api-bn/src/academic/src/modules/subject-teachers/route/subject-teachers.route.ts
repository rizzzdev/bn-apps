import { Router } from 'express';
import { subjectTeacherController } from '@academic/modules/subject-teachers/controller';

export const subjectTeachersRoute = Router();

subjectTeachersRoute.get('/', subjectTeacherController.getAll);
subjectTeachersRoute.post('/', subjectTeacherController.create);
subjectTeachersRoute.delete('/batch', subjectTeacherController.deleteBulk);
subjectTeachersRoute.patch('/batch/status', subjectTeacherController.updateStatusBulk);
subjectTeachersRoute.patch('/batch/target-hours', subjectTeacherController.updateTargetHoursBulk);
subjectTeachersRoute.get('/:id', subjectTeacherController.getById);
subjectTeachersRoute.patch('/:id', subjectTeacherController.update);
subjectTeachersRoute.delete('/:id', subjectTeacherController.delete);
