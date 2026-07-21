import { Router } from 'express';
import { majorStudentController } from '@/modules/major-students/controller';

export const majorStudentsRoute = Router();

majorStudentsRoute.get('/', majorStudentController.getAll);
majorStudentsRoute.post('/', majorStudentController.create);
majorStudentsRoute.post('/bulk', majorStudentController.createBulk);
majorStudentsRoute.post('/transfer', majorStudentController.transfer);
majorStudentsRoute.post('/graduate', majorStudentController.graduate);
majorStudentsRoute.delete('/bulk', majorStudentController.deleteBulk);
majorStudentsRoute.patch('/bulk/status', majorStudentController.updateStatusBulk);
majorStudentsRoute.get('/:id', majorStudentController.getById);
majorStudentsRoute.patch('/:id', majorStudentController.update);
majorStudentsRoute.delete('/:id', majorStudentController.delete);
