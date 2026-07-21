import { z } from 'zod';

export const createActivitySchema = z.object({
  actorId: z.string().trim().optional(),
  targetId: z.string().trim().optional(),
  description: z.string().trim().min(1, 'Deskripsi wajib diisi'),
  action: z.string().trim().optional(),
  isForAdmin: z.boolean().default(false),
});

export const updateActivitySchema = createActivitySchema.partial();
