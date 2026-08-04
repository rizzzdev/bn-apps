import { type ExamQuestion as ExamQuestionBase } from "#exam/database/index.js";
import { type z } from "zod";
import {
  type createExamQuestionSchema,
  type updateExamQuestionSchema,
} from "./exam-question.schema.js";

export type ExamQuestion = ExamQuestionBase;

export type CreateExamQuestionDto = z.infer<typeof createExamQuestionSchema>;
export type UpdateExamQuestionDto = z.infer<typeof updateExamQuestionSchema>;
