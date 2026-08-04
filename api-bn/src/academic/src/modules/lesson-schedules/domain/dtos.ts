import type { z } from 'zod';
import type {
  createLessonScheduleSchema,
  updateLessonScheduleSchema,
} from '#academic/modules/lesson-schedules/domain/schemas';

export type CreateLessonScheduleDto = z.infer<typeof createLessonScheduleSchema>;
export type UpdateLessonScheduleDto = z.infer<typeof updateLessonScheduleSchema>;
