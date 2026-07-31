import { z } from 'zod';
export const quizQuestionSchema = z.object({
    question: z.string().min(1),
    options: z.array(z.string().min(1)).min(2), // At least 2 options
    correctOption: z.number().min(0),
});
export const createQuizSchema = z
    .object({
    title: z.string().min(3),
    timeLimit: z.number().int().positive().optional(), // in minutes
    status: z.enum(['Draft', 'Published']).optional(),
    classId: z.string().uuid().optional(),
    classIds: z.array(z.string().uuid()).min(1).optional(),
    questions: z.array(quizQuestionSchema).min(1),
})
    .refine((data) => (data.classIds && data.classIds.length > 0) || Boolean(data.classId), {
    message: 'Pilih minimal satu kelas target',
    path: ['classIds'],
});
export const updateQuizSchema = z.object({
    title: z.string().min(3).optional(),
    timeLimit: z.number().int().positive().optional(),
    status: z.enum(['Draft', 'Published']).optional(),
    classId: z.string().uuid().optional(),
    classIds: z.array(z.string().uuid()).min(1).optional(),
    questions: z.array(quizQuestionSchema).optional(),
});
