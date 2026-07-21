import { z } from 'zod';
import { createAttendanceSchema } from './schemas.js';

export type CreateAttendanceDto = z.infer<typeof createAttendanceSchema>;
