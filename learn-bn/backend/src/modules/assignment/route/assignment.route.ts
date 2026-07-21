import { Router } from 'express';
import { assignmentController } from '../controller/assignment.controller';

export const assignmentRoute = Router();

assignmentRoute.post('/', assignmentController.create);
assignmentRoute.get('/class/:classId', assignmentController.getByClass);
assignmentRoute.get('/:id', assignmentController.getById);
assignmentRoute.put('/:id', assignmentController.update);
assignmentRoute.delete('/:id', assignmentController.delete);
assignmentRoute.post('/delete-bulk', assignmentController.bulkDelete);
