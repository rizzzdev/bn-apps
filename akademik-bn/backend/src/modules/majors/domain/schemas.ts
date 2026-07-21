import { z } from 'zod';

export const webhookMajorSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});
