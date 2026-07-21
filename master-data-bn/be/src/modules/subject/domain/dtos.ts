import { z } from 'zod';
import { batchGetSubjectSchema, createSubjectSchema, updateSubjectSchema } from '@/modules/subject/domain/schemas';

export type CreateSubjectDto = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectDto = z.infer<typeof updateSubjectSchema>;
export type BatchGetSubjectDto = z.infer<typeof batchGetSubjectSchema>;
