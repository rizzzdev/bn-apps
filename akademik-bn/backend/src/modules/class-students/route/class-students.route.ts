import { Router } from 'express';
import { classStudentController } from '@/modules/class-students/controller';

export const classStudentsRoute = Router();

classStudentsRoute.get('/', classStudentController.getAll);
classStudentsRoute.post('/', classStudentController.create);
classStudentsRoute.post('/bulk', classStudentController.createBulk);
classStudentsRoute.post('/promote', classStudentController.promote);
classStudentsRoute.post('/hold', classStudentController.hold);
classStudentsRoute.post('/transfer', classStudentController.transfer);
classStudentsRoute.post('/graduate', classStudentController.graduate);
classStudentsRoute.delete('/bulk', classStudentController.deleteBulk);
classStudentsRoute.patch('/bulk/status', classStudentController.updateStatusBulk);
classStudentsRoute.get('/:id', classStudentController.getById);
classStudentsRoute.patch('/:id', classStudentController.update);
classStudentsRoute.delete('/:id', classStudentController.delete);
