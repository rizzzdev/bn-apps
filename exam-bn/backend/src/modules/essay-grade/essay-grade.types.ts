import { type EssayGrade as EssayGradeBase } from "../../app/database/generated/client.js";
import { type z } from "zod";
import { type createEssayGradeSchema, type updateEssayGradeSchema } from "./essay-grade.schema.js";

export type EssayGrade = EssayGradeBase;
export type CreateEssayGradeDto = z.infer<typeof createEssayGradeSchema>;
export type UpdateEssayGradeDto = z.infer<typeof updateEssayGradeSchema>;
