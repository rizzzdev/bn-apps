import { z } from 'zod';
import { ActiveStatus } from '@academic/database/index.js';

export const createTeacherPicketScheduleSchema = z.object({
  teacherId: z.string().uuid(),
  day: z.enum(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']),
  status: z.nativeEnum(ActiveStatus),
});

export const updateTeacherPicketScheduleSchema = createTeacherPicketScheduleSchema.partial();
