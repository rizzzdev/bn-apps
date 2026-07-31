import { z } from 'zod';
const webhookSemesterSchema = z.object({
    id: z.string(),
    type: z.string(),
    status: z.string().optional(),
}).passthrough();
export const webhookAcademicYearSchema = z.object({
    id: z.string(),
    code: z.string(),
    status: z.string().optional(),
    semesters: z.array(webhookSemesterSchema).optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    deletedAt: z.string().nullable(),
}).passthrough();
