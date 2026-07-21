import { z } from 'zod';
import { createCompanySchema, updateCompanySchema, bulkCreateCompanySchema } from './schemas.js';

export type CreateCompanyDto = z.infer<typeof createCompanySchema>;
export type UpdateCompanyDto = z.infer<typeof updateCompanySchema>;
export type BulkCreateCompanyDto = z.infer<typeof bulkCreateCompanySchema>;
