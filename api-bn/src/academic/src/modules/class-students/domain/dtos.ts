import type { z } from 'zod';
import type {
  createClassStudentSchema,
  updateClassStudentSchema,
  promoteSchema,
  holdSchema,
  transferSchema,
  graduateSchema,
} from '#academic/modules/class-students/domain/schemas';

export type CreateClassStudentDto = z.infer<typeof createClassStudentSchema>;
export type UpdateClassStudentDto = z.infer<typeof updateClassStudentSchema>;
export type PromoteDto = z.infer<typeof promoteSchema>;
export type HoldDto = z.infer<typeof holdSchema>;
export type TransferDto = z.infer<typeof transferSchema>;
export type GraduateDto = z.infer<typeof graduateSchema>;
