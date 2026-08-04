import { z } from "zod";

export const createExamScoreSchema = z.strictObject({
  examRoomId: z.string().min(1, "Exam room ID is required"),
  userId: z.string().min(1, "User ID is required"),
  score: z.number().min(0).max(100).nullish(),
  passed: z.boolean().nullish(),
});

export const updateExamScoreSchema = createExamScoreSchema.partial();
