import { z } from 'zod';
export const bulkDeleteSchema = z.object({
    ids: z.array(z.string().uuid()),
});
