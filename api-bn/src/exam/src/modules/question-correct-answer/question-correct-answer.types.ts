import { type QuestionCorrectAnswer as QuestionCorrectAnswerBase } from "#exam/database/index.js";
import { type z } from "zod";
import {
  type createQuestionCorrectAnswerSchema,
  type updateQuestionCorrectAnswerSchema,
} from "./question-correct-answer.schema.js";

export type QuestionCorrectAnswer = QuestionCorrectAnswerBase;

export type CreateQuestionCorrectAnswerDto = z.infer<typeof createQuestionCorrectAnswerSchema>;
export type UpdateQuestionCorrectAnswerDto = z.infer<typeof updateQuestionCorrectAnswerSchema>;
