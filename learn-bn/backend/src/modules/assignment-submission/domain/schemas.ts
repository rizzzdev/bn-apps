import { z } from 'zod';

export const submitAssignmentSchema = z.object({
  fileUrl: z.string().min(1),
  fileName: z.string().min(1),
});

export const gradeAssignmentSchema = z.object({
  grade: z.number().min(0).max(100),
  feedback: z.string().optional(),
});

export type SubmitAssignmentDto = z.infer<typeof submitAssignmentSchema>;
export type GradeAssignmentDto = z.infer<typeof gradeAssignmentSchema>;
