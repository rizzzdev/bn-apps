import { z } from 'zod';
export const webhookClassSchema = z.object({
    id: z.string(),
    name: z.string(),
    majorId: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    deletedAt: z.string().nullable(),
}).passthrough();
