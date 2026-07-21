import type { z } from 'zod';
import type {
  createMajorStudentSchema,
  updateMajorStudentSchema,
  transferSchema,
  graduateSchema,
} from '@/modules/major-students/domain/schemas';

export type CreateMajorStudentDto = z.infer<typeof createMajorStudentSchema>;
export type UpdateMajorStudentDto = z.infer<typeof updateMajorStudentSchema>;
export type TransferDto = z.infer<typeof transferSchema>;
export type GraduateDto = z.infer<typeof graduateSchema>;
