import { Router } from 'express';
import { validate } from '@/middlewares/index.js';
import { activityController } from '@/modules/activity/controller/index.js';
import { createActivitySchema, updateActivitySchema } from '@/modules/activity/domain/index.js';

export const activityRoute = Router();

activityRoute.get('/', activityController.getAll);
activityRoute.get('/:id', activityController.getById);
activityRoute.post('/', validate(createActivitySchema), activityController.create);
activityRoute.put('/:id', validate(updateActivitySchema), activityController.update);
activityRoute.delete('/:id', activityController.delete);
