import { z } from 'zod';
import { createAssessmentSchema, updateAssessmentSchema } from './schemas.js';

export type CreateAssessmentDto = z.infer<typeof createAssessmentSchema>;
export type UpdateAssessmentDto = z.infer<typeof updateAssessmentSchema>;
