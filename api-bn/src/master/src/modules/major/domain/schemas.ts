import { z } from 'zod';


export const createMajorSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
});

export const updateMajorSchema = createMajorSchema.partial();

export const batchGetMajorSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});
