import { z } from 'zod';
import { batchGetAttachmentsSchema, bulkDeleteAttachmentsSchema } from '@/modules/attachment/domain/schemas';

export type BulkDeleteAttachmentsDto = z.infer<typeof bulkDeleteAttachmentsSchema>;
export type BatchGetAttachmentsDto = z.infer<typeof batchGetAttachmentsSchema>;
