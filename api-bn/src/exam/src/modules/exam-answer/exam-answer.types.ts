import { type ExamAnswer as ExamAnswerBase } from "#exam/database/index.js";
import { type z } from "zod";
import { type createExamAnswerSchema, type updateExamAnswerSchema } from "./exam-answer.schema.js";

export type ExamAnswer = ExamAnswerBase;

export type CreateExamAnswerDto = z.infer<typeof createExamAnswerSchema>;
export type UpdateExamAnswerDto = z.infer<typeof updateExamAnswerSchema>;
