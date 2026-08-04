import { z } from 'zod';
import { ActiveStatus } from '#academic/database/index.js';

export const createHomeroomTeacherSchema = z.object({
  teacherId: z.string().uuid(),
  classId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  status: z.nativeEnum(ActiveStatus),
});

export const updateHomeroomTeacherSchema = createHomeroomTeacherSchema.partial();
