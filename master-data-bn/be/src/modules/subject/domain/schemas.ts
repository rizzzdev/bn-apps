import { z } from 'zod';


export const createSubjectSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
});

export const updateSubjectSchema = createSubjectSchema.partial();

export const batchGetSubjectSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});
