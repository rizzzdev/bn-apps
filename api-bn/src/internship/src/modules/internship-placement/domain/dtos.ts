import { z } from 'zod';
import { createInternshipPlacementSchema, updateInternshipPlacementSchema, bulkCreateInternshipPlacementSchema, bulkUpdateStatusSchema, bulkUpdateAssessableSchema } from './schemas.js';

export type CreateInternshipPlacementDto = z.infer<typeof createInternshipPlacementSchema>;
export type UpdateInternshipPlacementDto = z.infer<typeof updateInternshipPlacementSchema>;
export type BulkCreateInternshipPlacementDto = z.infer<typeof bulkCreateInternshipPlacementSchema>;
export type BulkUpdateStatusDto = z.infer<typeof bulkUpdateStatusSchema>;
export type BulkUpdateAssessableDto = z.infer<typeof bulkUpdateAssessableSchema>;
