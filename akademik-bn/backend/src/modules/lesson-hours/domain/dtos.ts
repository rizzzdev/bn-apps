import type { z } from 'zod';
import type { createLessonHourSchema, updateLessonHourSchema } from '@/modules/lesson-hours/domain/schemas';

export type CreateLessonHourDto = z.infer<typeof createLessonHourSchema>;
export type UpdateLessonHourDto = z.infer<typeof updateLessonHourSchema>;
