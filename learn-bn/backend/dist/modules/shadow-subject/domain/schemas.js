import { z } from 'zod';
export const webhookSubjectSchema = z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    deletedAt: z.string().nullable(),
}).passthrough();
