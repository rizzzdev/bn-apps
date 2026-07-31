import { Router } from 'express';
import { majorController } from '../controller';
export const majorRoute = Router();
majorRoute.get('/', majorController.getAll);
