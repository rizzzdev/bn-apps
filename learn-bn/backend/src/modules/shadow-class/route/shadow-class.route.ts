import { Router } from 'express';
import { classController } from '../controller';

export const classRoute = Router();

classRoute.get('/', classController.getAll);
