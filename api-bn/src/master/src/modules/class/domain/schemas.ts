import { z } from 'zod';


export const createClassSchema = z.object({
  name: z.string().min(1),
  majorId: z.string().uuid(),
});

export const updateClassSchema = createClassSchema.partial();

export const batchGetClassSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});
