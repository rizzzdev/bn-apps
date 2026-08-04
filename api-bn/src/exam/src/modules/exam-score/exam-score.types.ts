import { type ExamScore as ExamScoreBase } from "#exam/database/index.js";
import { type z } from "zod";
import { type createExamScoreSchema, type updateExamScoreSchema } from "./exam-score.schema.js";

export type ExamScore = ExamScoreBase;

export type CreateExamScoreDto = z.infer<typeof createExamScoreSchema>;
export type UpdateExamScoreDto = z.infer<typeof updateExamScoreSchema>;
