import { Router } from 'express';
import { scheduleEventController } from '#academic/modules/schedule-events/controller';
import { validate } from '#academic/middlewares/validate';
import {
  createScheduleEventSchema,
  updateScheduleEventSchema,
  deleteScheduleEventsBatchSchema,
} from '#academic/modules/schedule-events/domain';

export const scheduleEventsRoute = Router();

scheduleEventsRoute.get('/', scheduleEventController.getAll);
scheduleEventsRoute.post('/', validate(createScheduleEventSchema), scheduleEventController.create);
scheduleEventsRoute.delete('/batch', validate(deleteScheduleEventsBatchSchema), scheduleEventController.deleteBulk);
scheduleEventsRoute.get('/:id', scheduleEventController.getById);
scheduleEventsRoute.put('/:id', validate(updateScheduleEventSchema), scheduleEventController.update);
scheduleEventsRoute.delete('/:id', scheduleEventController.delete);
