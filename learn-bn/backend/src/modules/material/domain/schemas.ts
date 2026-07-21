import { z } from 'zod';

export const materialAttachmentSchema = z.object({
  fileUrl: z.string().min(1),
  fileName: z.string().min(1),
});

export const createMaterialSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(1),
  classId: z.string().uuid(),
  attachments: z.array(materialAttachmentSchema).optional(),
});

export const updateMaterialSchema = createMaterialSchema.partial();

export type MaterialAttachmentDto = z.infer<typeof materialAttachmentSchema>;
export type CreateMaterialDto = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialDto = z.infer<typeof updateMaterialSchema>;
