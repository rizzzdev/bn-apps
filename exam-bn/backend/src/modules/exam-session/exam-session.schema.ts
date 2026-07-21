import { z } from "zod";

export const updateProgressSchema = z.object({
  body: z.object({
    currentQuestionIndex: z.number().int().min(0, "Question index must be at least 0"),
  }),
});
