import { z } from 'zod';

export const webhookClassSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  majorId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});
