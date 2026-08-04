import type { z } from 'zod';
import type {
  createScheduleEventSchema,
  updateScheduleEventSchema,
} from '#academic/modules/schedule-events/domain/schemas';

export type CreateScheduleEventDto = z.infer<typeof createScheduleEventSchema>;
export type UpdateScheduleEventDto = z.infer<typeof updateScheduleEventSchema>;
