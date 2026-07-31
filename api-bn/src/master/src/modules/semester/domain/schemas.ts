import { z } from 'zod';
import { SemesterType, AcademicStatus } from '@master/database/index.js';

export const createSemesterSchema = z.object({
  type: z.nativeEnum(SemesterType),
  status: z.nativeEnum(AcademicStatus).optional(),
  academicYearId: z.string().uuid(),
});

export const updateSemesterSchema = createSemesterSchema.partial();

export const batchGetSemesterSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});
