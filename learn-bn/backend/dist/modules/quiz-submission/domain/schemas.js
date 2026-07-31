import { z } from 'zod';
export const startQuizSchema = z.object({
    quizId: z.string().uuid(),
});
export const submitAnswerSchema = z.object({
    quizQuestionId: z.string().uuid(),
    selectedOption: z.number().min(0),
});
export const finishQuizSchema = z.object({
    answers: z.array(submitAnswerSchema),
});
