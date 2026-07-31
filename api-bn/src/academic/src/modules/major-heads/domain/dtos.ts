import type { z } from 'zod';
import type {
  createMajorHeadSchema,
  updateMajorHeadSchema,
} from '@academic/modules/major-heads/domain/schemas';

export type CreateMajorHeadDto = z.infer<typeof createMajorHeadSchema>;
export type UpdateMajorHeadDto = z.infer<typeof updateMajorHeadSchema>;
