import { z } from 'zod';

export const bulkDeleteAttachmentsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export const batchGetAttachmentsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});
