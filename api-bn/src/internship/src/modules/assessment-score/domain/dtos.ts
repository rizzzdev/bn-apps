import { z } from 'zod';
import {
  createAssessmentScoreSchema,
  updateAssessmentScoreSchema,
  bulkSubmitScoreSchema,
} from './schemas.js';

export type CreateAssessmentScoreDto = z.infer<typeof createAssessmentScoreSchema>;
export type UpdateAssessmentScoreDto = z.infer<typeof updateAssessmentScoreSchema>;
export type BulkSubmitScoreDto = z.infer<typeof bulkSubmitScoreSchema>;
