import { z } from 'zod';
import { batchGetAcademicYearSchema, createAcademicYearSchema, updateAcademicYearSchema } from '@master/modules/academic-year/domain/schemas';

export type CreateAcademicYearDto = z.infer<typeof createAcademicYearSchema>;
export type UpdateAcademicYearDto = z.infer<typeof updateAcademicYearSchema>;
export type BatchGetAcademicYearDto = z.infer<typeof batchGetAcademicYearSchema>;
