import type { z } from 'zod';
import type {
  createTeacherPicketScheduleSchema,
  updateTeacherPicketScheduleSchema,
} from '@/modules/teacher-picket-schedules/domain/schemas';

export type CreateTeacherPicketScheduleDto = z.infer<typeof createTeacherPicketScheduleSchema>;
export type UpdateTeacherPicketScheduleDto = z.infer<typeof updateTeacherPicketScheduleSchema>;
