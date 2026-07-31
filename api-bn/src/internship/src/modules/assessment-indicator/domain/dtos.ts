import { z } from 'zod';
import { createAssessmentIndicatorSchema, updateAssessmentIndicatorSchema, bulkCreateAssessmentIndicatorSchema, bulkDeleteIndicatorSchema } from './schemas.js';

export type CreateAssessmentIndicatorDto = z.infer<typeof createAssessmentIndicatorSchema>;
export type UpdateAssessmentIndicatorDto = z.infer<typeof updateAssessmentIndicatorSchema>;
export type BulkCreateAssessmentIndicatorDto = z.infer<typeof bulkCreateAssessmentIndicatorSchema>;
export type BulkDeleteIndicatorDto = z.infer<typeof bulkDeleteIndicatorSchema>;
