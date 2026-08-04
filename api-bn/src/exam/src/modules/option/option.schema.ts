import { z } from "zod";

export const createOptionSchema = z.strictObject({
  questionId: z.string().min(1, "Question ID is required"),
  text: z.string().min(1, "Option text is required"),
});

export const updateOptionSchema = createOptionSchema.partial();
