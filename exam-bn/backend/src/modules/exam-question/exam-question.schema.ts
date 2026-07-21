import { z } from "zod";

export const createExamQuestionSchema = z.strictObject({
  examRoomId: z.string().min(1, "Exam room ID is required"),
  questionId: z.string().min(1, "Question ID is required"),
  questionNumber: z.number().int().positive("Question number must be a positive integer"),
});

export const updateExamQuestionSchema = createExamQuestionSchema.partial();
