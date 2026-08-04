import { z } from 'zod';
import { batchGetApplicationSchema, createApplicationSchema, updateApplicationSchema } from '#master/modules/application/domain/schemas';

export type CreateApplicationDto = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationDto = z.infer<typeof updateApplicationSchema>;
export type BatchGetApplicationDto = z.infer<typeof batchGetApplicationSchema>;
