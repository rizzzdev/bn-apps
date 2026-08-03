import { z } from 'zod';
import { batchGetTeacherSchema, createTeacherSchema, updateTeacherSchema, bulkUpdateTeacherStatusSchema, changePasswordSchema } from '@master/modules/teacher/domain/schemas';

export type CreateTeacherDto = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherDto = z.infer<typeof updateTeacherSchema>;
export type BatchGetTeacherDto = z.infer<typeof batchGetTeacherSchema>;
export type BulkUpdateTeacherStatusDto = z.infer<typeof bulkUpdateTeacherStatusSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
