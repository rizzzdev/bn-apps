import type { z } from 'zod';
import type {
  createClassSubjectRequirementSchema,
  updateClassSubjectRequirementSchema,
  bulkUpsertClassSubjectRequirementSchema,
} from './schemas';

export type CreateClassSubjectRequirementDto = z.infer<typeof createClassSubjectRequirementSchema>;
export type UpdateClassSubjectRequirementDto = z.infer<typeof updateClassSubjectRequirementSchema>;
export type BulkUpsertClassSubjectRequirementDto = z.infer<typeof bulkUpsertClassSubjectRequirementSchema>;
