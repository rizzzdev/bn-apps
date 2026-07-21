import { z } from 'zod';
import { ActiveStatus } from '@/database/generated/client';

export const createHomeroomTeacherSchema = z.object({
  teacherId: z.string().uuid(),
  classId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  status: z.nativeEnum(ActiveStatus),
});

export const updateHomeroomTeacherSchema = createHomeroomTeacherSchema.partial();
