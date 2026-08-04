import {
  type Question as QuestionBase,
  type Option as OptionBase,
  type QuestionCorrectAnswer as QuestionCorrectAnswerBase,
} from "#exam/database/index.js";
import { type z } from "zod";
import { type createQuestionSchema, type updateQuestionSchema } from "./question.schema.js";

export type QuestionType = "MULTIPLE_CHOICE" | "ESSAY";
export const QuestionTypeValues = ["MULTIPLE_CHOICE", "ESSAY"] as const;

export type Question = Omit<QuestionBase, "type"> & {
  type: QuestionType;
  options?: OptionBase[];
  correctAnswer?: QuestionCorrectAnswerBase | null;
};

export type CreateQuestionDto = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionDto = z.infer<typeof updateQuestionSchema>;
