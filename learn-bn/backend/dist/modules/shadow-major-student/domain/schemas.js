import { z } from 'zod';
export const webhookMajorStudentSchema = z.object({
    id: z.string(),
    // Add more strict validations based on actual API payload
}).passthrough();
