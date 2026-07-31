import { z } from 'zod';
import { ClassStudentStatus } from '@academic/database/index.js';

export const createClassStudentSchema = z.object({
  classId: z.string().uuid(),
  studentId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  status: z.nativeEnum(ClassStudentStatus),
});

export const updateClassStudentSchema = createClassStudentSchema.partial();

export const promoteSchema = z.object({
  studentIds: z.array(z.string().uuid()).min(1),
  classId: z.string().uuid(),
});

export const holdSchema = z.object({
  studentIds: z.array(z.string().uuid()).min(1),
  classId: z.string().uuid(),
});

export const transferSchema = z.object({
  studentIds: z.array(z.string().uuid()).min(1),
  classId: z.string().uuid().optional(),
});

export const graduateSchema = z.object({
  studentIds: z.array(z.string().uuid()).min(1),
});
