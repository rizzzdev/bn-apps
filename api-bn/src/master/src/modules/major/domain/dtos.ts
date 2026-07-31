import { z } from 'zod';
import { batchGetMajorSchema, createMajorSchema, updateMajorSchema } from '@master/modules/major/domain/schemas';

export type CreateMajorDto = z.infer<typeof createMajorSchema>;
export type UpdateMajorDto = z.infer<typeof updateMajorSchema>;
export type BatchGetMajorDto = z.infer<typeof batchGetMajorSchema>;
