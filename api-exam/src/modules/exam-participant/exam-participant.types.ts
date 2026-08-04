import { type ExamParticipant as ExamParticipantBase } from "../../app/database/generated/client.js";
import { type z } from "zod";
import {
  type createExamParticipantSchema,
  type updateExamParticipantSchema,
} from "./exam-participant.schema.js";

export type ExamParticipant = ExamParticipantBase;

export type CreateExamParticipantDto = z.infer<typeof createExamParticipantSchema>;
export type UpdateExamParticipantDto = z.infer<typeof updateExamParticipantSchema>;
