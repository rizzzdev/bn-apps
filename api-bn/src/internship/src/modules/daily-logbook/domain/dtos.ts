import { z } from 'zod';
import { createDailyLogbookSchema, updateDailyLogbookSchema } from './schemas.js';

export type CreateDailyLogbookDto = z.infer<typeof createDailyLogbookSchema>;
export type UpdateDailyLogbookDto = z.infer<typeof updateDailyLogbookSchema>;
