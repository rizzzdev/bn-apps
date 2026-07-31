import { z } from 'zod';
export const webhookClassStudentSchema = z.object({
    id: z.string(),
    // Add more strict validations based on actual API payload
}).passthrough();
