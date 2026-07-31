import { Router } from 'express';
import { dashboardController } from '@master/modules/dashboard/controller';

export const dashboardRoute = Router();

dashboardRoute.get('/summary', dashboardController.getSummary);
