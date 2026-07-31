import type { z } from 'zod';
import type { createTeacherUnavailabilitySchema, bulkSetTeacherUnavailabilitySchema } from './schemas';

export type CreateTeacherUnavailabilityDto = z.infer<typeof createTeacherUnavailabilitySchema>;
export type BulkSetTeacherUnavailabilityDto = z.infer<typeof bulkSetTeacherUnavailabilitySchema>;
