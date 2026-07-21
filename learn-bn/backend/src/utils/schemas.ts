import { z } from 'zod';

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()),
});

export type BulkDeleteDto = z.infer<typeof bulkDeleteSchema>;
