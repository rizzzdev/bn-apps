import { z } from "zod";

export const createEssayGradeSchema = z.strictObject({
  examRoomId: z.string().min(1),
  userId: z.string().min(1),
  questionId: z.string().min(1),
  points: z.number().int().min(0).max(10),
});

export const updateEssayGradeSchema = createEssayGradeSchema.partial();
