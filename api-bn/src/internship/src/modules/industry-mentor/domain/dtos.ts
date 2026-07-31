import { z } from 'zod';
import { createIndustryMentorSchema, updateIndustryMentorSchema, changePasswordSchema, bulkCreateIndustryMentorSchema } from './schemas.js';

export type CreateIndustryMentorDto = z.infer<typeof createIndustryMentorSchema>;
export type UpdateIndustryMentorDto = z.infer<typeof updateIndustryMentorSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
export type BulkCreateIndustryMentorDto = z.infer<typeof bulkCreateIndustryMentorSchema>;
