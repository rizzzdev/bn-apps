import { z } from 'zod';
import { batchGetAttachmentsSchema, bulkDeleteAttachmentsSchema } from '#master/modules/attachment/domain/schemas';

export type BulkDeleteAttachmentsDto = z.infer<typeof bulkDeleteAttachmentsSchema>;
export type BatchGetAttachmentsDto = z.infer<typeof batchGetAttachmentsSchema>;
