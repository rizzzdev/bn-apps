import { Router } from 'express';
import { subjectController } from '@/modules/subjects/controller';

export const subjectsRoute = Router();

subjectsRoute.get('/', subjectController.getAll);
subjectsRoute.get('/:id', subjectController.getById);
