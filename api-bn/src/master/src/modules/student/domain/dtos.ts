import { z } from 'zod';
import { batchGetStudentSchema, createStudentSchema, updateStudentSchema, bulkUpdateStudentStatusSchema, changePasswordSchema } from '@master/modules/student/domain/schemas';

export type CreateStudentDto = z.infer<typeof createStudentSchema>;
export type UpdateStudentDto = z.infer<typeof updateStudentSchema>;
export type BatchGetStudentDto = z.infer<typeof batchGetStudentSchema>;
export type BulkUpdateStudentStatusDto = z.infer<typeof bulkUpdateStudentStatusSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
