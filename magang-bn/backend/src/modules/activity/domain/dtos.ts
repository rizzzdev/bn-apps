import { z } from 'zod';
import { createActivitySchema, updateActivitySchema } from './schemas.js';

export type CreateActivityDto = z.infer<typeof createActivitySchema>;
export type UpdateActivityDto = z.infer<typeof updateActivitySchema>;
