import { z } from 'zod';
export const bulkAttachmentSchema = z.object({
    ids: z.array(z.string().uuid()),
});
