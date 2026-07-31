import { z } from 'zod';
import { SubjectTeacherStatus } from '@academic/database/index.js';

export const createSubjectTeacherSchema = z.object({
  teacherId: z.string().uuid(),
  subjectId: z.string().uuid(),
  status: z.nativeEnum(SubjectTeacherStatus),
  targetHours: z.number().int().min(0).optional(),
});

export const updateSubjectTeacherSchema = createSubjectTeacherSchema.partial();
