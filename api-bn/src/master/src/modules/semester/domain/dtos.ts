import { z } from 'zod';
import { batchGetSemesterSchema, createSemesterSchema, updateSemesterSchema } from '@master/modules/semester/domain/schemas';

export type CreateSemesterDto = z.infer<typeof createSemesterSchema>;
export type UpdateSemesterDto = z.infer<typeof updateSemesterSchema>;
export type BatchGetSemesterDto = z.infer<typeof batchGetSemesterSchema>;
