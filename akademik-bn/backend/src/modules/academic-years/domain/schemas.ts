import { z } from 'zod';
import { SemesterType } from '@/database/generated/client';

const semesterTypeSchema = z.nativeEnum(SemesterType);

export const webhookAcademicYearSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  status: z.string().optional(),
  semesters: z.array(z.object({
    id: z.string().uuid(),
    type: semesterTypeSchema,
    status: z.string().optional(),
  })).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});
