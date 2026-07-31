import type { z } from 'zod';
import type {
  createSubjectTeacherSchema,
  updateSubjectTeacherSchema,
} from '@academic/modules/subject-teachers/domain/schemas';

export type CreateSubjectTeacherDto = z.infer<typeof createSubjectTeacherSchema>;
export type UpdateSubjectTeacherDto = z.infer<typeof updateSubjectTeacherSchema>;
