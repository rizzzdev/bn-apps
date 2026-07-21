import { type ExamRoom as ExamRoomBase } from "../../app/database/generated/client.js";
import { type z } from "zod";
import { type createExamRoomSchema, type updateExamRoomSchema } from "./exam-room.schema.js";

export type ExamRoom = ExamRoomBase;

export type CreateExamRoomDto = z.infer<typeof createExamRoomSchema>;
export type UpdateExamRoomDto = z.infer<typeof updateExamRoomSchema>;
