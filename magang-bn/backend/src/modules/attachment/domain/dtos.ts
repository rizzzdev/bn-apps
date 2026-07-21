import { z } from 'zod';
import { createAttachmentSchema, updateAttachmentSchema } from './schemas.js';

export type CreateAttachmentDto = z.infer<typeof createAttachmentSchema>;
export type UpdateAttachmentDto = z.infer<typeof updateAttachmentSchema>;
