import { z } from 'zod';
import { SubjectTeacherStatus } from '@/database/generated/client';

export const createSubjectTeacherSchema = z.object({
  teacherId: z.string().uuid(),
  subjectId: z.string().uuid(),
  status: z.nativeEnum(SubjectTeacherStatus),
});

export const updateSubjectTeacherSchema = createSubjectTeacherSchema.partial();
