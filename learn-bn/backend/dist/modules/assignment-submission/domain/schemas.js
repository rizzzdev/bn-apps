import { z } from 'zod';
export const submitAssignmentSchema = z.object({
    fileUrl: z.string().optional(),
    fileName: z.string().optional(),
    content: z.string().optional(),
});
export const gradeAssignmentSchema = z.object({
    grade: z.number().min(0).max(100),
    feedback: z.string().optional(),
});
export const bulkGradeSchema = z.object({
    grades: z.array(z.object({
        submissionId: z.string(),
        grade: z.number().min(0).max(100),
        feedback: z.string().optional(),
    })),
});
