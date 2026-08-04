import { z } from "zod";

export const createExamAnswerSchema = z.strictObject({
  examRoomId: z.string().min(1, "Exam room ID is required"),
  userId: z.string().min(1, "User ID is required"),
  questionId: z.string().min(1, "Question ID is required"),
  optionId: z.string().nullish(),
  text: z.string().nullish(),
});

export const updateExamAnswerSchema = createExamAnswerSchema.partial();
