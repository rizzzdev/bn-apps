import { type QuestionCorrectAnswer as QuestionCorrectAnswerBase } from "../../app/database/generated/client.js";
import { type z } from "zod";
import {
  type createQuestionCorrectAnswerSchema,
  type updateQuestionCorrectAnswerSchema,
} from "./question-correct-answer.schema.js";

export type QuestionCorrectAnswer = QuestionCorrectAnswerBase;

export type CreateQuestionCorrectAnswerDto = z.infer<typeof createQuestionCorrectAnswerSchema>;
export type UpdateQuestionCorrectAnswerDto = z.infer<typeof updateQuestionCorrectAnswerSchema>;
