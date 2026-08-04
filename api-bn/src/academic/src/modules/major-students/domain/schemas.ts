import { z } from 'zod';
import { MajorStudentStatus } from '#academic/database/index.js';

export const createMajorStudentSchema = z.object({
  majorId: z.string().uuid(),
  studentId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  status: z.nativeEnum(MajorStudentStatus),
});

export const updateMajorStudentSchema = createMajorStudentSchema.partial();

export const transferSchema = z.object({
  studentIds: z.array(z.string().uuid()).min(1),
});

export const graduateSchema = z.object({
  studentIds: z.array(z.string().uuid()).min(1),
});
