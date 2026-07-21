import { Router } from 'express';
import { subjectController } from '../controller';

export const subjectRoute = Router();

subjectRoute.get('/', subjectController.getAll);
