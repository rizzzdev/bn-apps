import { z } from 'zod';
import { AcademicStatus } from '#master/database/index.js';

export const createAcademicYearSchema = z.object({
  code: z.string().min(1).optional(),
  startYear: z.number().int(),
  endYear: z.number().int(),
  status: z.nativeEnum(AcademicStatus).optional(),
});

export const updateAcademicYearSchema = createAcademicYearSchema.partial();

export const batchGetAcademicYearSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});
