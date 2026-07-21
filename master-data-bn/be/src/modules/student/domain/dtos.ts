import { z } from 'zod';
import { batchGetStudentSchema, createStudentSchema, updateStudentSchema, bulkUpdateStudentStatusSchema } from '@/modules/student/domain/schemas';

export type CreateStudentDto = z.infer<typeof createStudentSchema>;
export type UpdateStudentDto = z.infer<typeof updateStudentSchema>;
export type BatchGetStudentDto = z.infer<typeof batchGetStudentSchema>;
export type BulkUpdateStudentStatusDto = z.infer<typeof bulkUpdateStudentStatusSchema>;
