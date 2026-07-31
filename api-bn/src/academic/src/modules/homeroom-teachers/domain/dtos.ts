import type { z } from 'zod';
import type {
  createHomeroomTeacherSchema,
  updateHomeroomTeacherSchema,
} from '@academic/modules/homeroom-teachers/domain/schemas';

export type CreateHomeroomTeacherDto = z.infer<typeof createHomeroomTeacherSchema>;
export type UpdateHomeroomTeacherDto = z.infer<typeof updateHomeroomTeacherSchema>;
