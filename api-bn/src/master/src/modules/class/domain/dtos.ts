import { z } from 'zod';
import { batchGetClassSchema, createClassSchema, updateClassSchema } from '@master/modules/class/domain/schemas';

export type CreateClassDto = z.infer<typeof createClassSchema>;
export type UpdateClassDto = z.infer<typeof updateClassSchema>;
export type BatchGetClassDto = z.infer<typeof batchGetClassSchema>;
