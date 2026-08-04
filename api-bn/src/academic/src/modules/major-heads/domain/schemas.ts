import { z } from 'zod';
import { ActiveStatus } from '#academic/database/index.js';

export const createMajorHeadSchema = z.object({
  teacherId: z.string().uuid(),
  majorId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  status: z.nativeEnum(ActiveStatus),
});

export const assignMajorHeadSchema = z.object({
  majorId: z.string().uuid(),
  teacherId: z.string().uuid(),
  academicYearId: z.string().uuid().optional(),
});

export type AssignMajorHeadDto = z.infer<typeof assignMajorHeadSchema>;

export const updateMajorHeadSchema = createMajorHeadSchema.partial();
