import { z } from "zod";

export const createQuestionSchema = z.strictObject({
  text: z.string().min(1, "Question text is required"),
  type: z.enum(["MULTIPLE_CHOICE", "ESSAY"]),
});

export const updateQuestionSchema = createQuestionSchema.partial();
