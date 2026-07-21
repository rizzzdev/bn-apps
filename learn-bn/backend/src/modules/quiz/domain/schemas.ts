import { z } from 'zod';

export const quizQuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2), // At least 2 options
  correctOption: z.number().min(0),
});

export const createQuizSchema = z.object({
  title: z.string().min(3),
  timeLimit: z.number().int().positive().optional(), // in minutes
  classId: z.string().uuid(),
  questions: z.array(quizQuestionSchema).min(1),
});

export const updateQuizSchema = z.object({
  title: z.string().min(3).optional(),
  timeLimit: z.number().int().positive().optional(),
  classId: z.string().uuid().optional(),
  questions: z.array(quizQuestionSchema).optional(),
});

export type QuizQuestionDto = z.infer<typeof quizQuestionSchema>;
export type CreateQuizDto = z.infer<typeof createQuizSchema>;
export type UpdateQuizDto = z.infer<typeof updateQuizSchema>;
