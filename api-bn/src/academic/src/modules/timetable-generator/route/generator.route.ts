import { Router } from 'express';
import { generatorController } from '../controller';
import { validate } from '@academic/middlewares/validate';
import { generateScheduleOptionsSchema, commitScheduleSchema } from '../domain';

export const generatorRoute = Router();

generatorRoute.post('/preview', validate(generateScheduleOptionsSchema), generatorController.preview);
generatorRoute.post('/commit', validate(commitScheduleSchema), generatorController.commit);
