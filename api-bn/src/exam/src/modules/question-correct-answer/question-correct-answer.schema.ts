import { z } from "zod";

export const createQuestionCorrectAnswerSchema = z.strictObject({
  questionId: z.string().min(1, "Question ID is required"),
  optionId: z.string().min(1, "Option ID is required"),
});

export const updateQuestionCorrectAnswerSchema = createQuestionCorrectAnswerSchema.partial();
