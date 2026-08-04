import { Router } from 'express';
import { majorStudentController } from '#academic/modules/major-students/controller';

export const majorStudentsRoute = Router();

majorStudentsRoute.get('/', majorStudentController.getAll);
majorStudentsRoute.post('/', majorStudentController.create);
majorStudentsRoute.post('/batch', majorStudentController.createBulk);
majorStudentsRoute.post('/transfer', majorStudentController.transfer);
majorStudentsRoute.post('/graduate', majorStudentController.graduate);
majorStudentsRoute.delete('/batch', majorStudentController.deleteBulk);
majorStudentsRoute.patch('/batch/status', majorStudentController.updateStatusBulk);
majorStudentsRoute.get('/:id', majorStudentController.getById);
majorStudentsRoute.put('/:id', majorStudentController.update);
majorStudentsRoute.delete('/:id', majorStudentController.delete);
