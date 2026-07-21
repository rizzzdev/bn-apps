import { Router } from 'express';
import { materialController } from '../controller/material.controller';

export const materialRoute = Router();

materialRoute.post('/', materialController.create);
materialRoute.get('/class/:classId', materialController.getByClass);
materialRoute.get('/:id', materialController.getById);
materialRoute.put('/:id', materialController.update);
materialRoute.delete('/:id', materialController.delete);
materialRoute.post('/delete-bulk', materialController.bulkDelete);
