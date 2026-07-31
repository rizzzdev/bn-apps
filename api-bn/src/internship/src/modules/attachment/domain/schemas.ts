import { z } from 'zod';

export const createAttachmentSchema = z.object({
  filename: z.string().trim().min(1, 'Filename wajib diisi'),
  format: z.string().trim().min(1, 'Format wajib diisi'),
  size: z.number().min(0),
  url: z.string().trim().optional(),
});

export const updateAttachmentSchema = createAttachmentSchema.partial();
