import { type Request, type Response } from "express";
import { type ExamSessionService } from "./exam-session.service.js";
import { type UpdateProgressDto } from "./exam-session.types.js";
import { type TokenPayload } from "../auth/auth.types.js";
import { sendSuccess } from "../../utils/response.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export class ExamSessionController {
  constructor(private readonly service: ExamSessionService) {}

  getSession = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const examRoomId = request.params.examRoomId as string;
    const payload = request.user as TokenPayload;
    const data = await this.service.getOrCreate(examRoomId, payload.id);
    sendSuccess({ response, data, message: "Exam session retrieved successfully." });
  });

  updateProgress = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const examRoomId = request.params.examRoomId as string;
    const payload = request.user as TokenPayload;
    const dto = request.body as UpdateProgressDto;
    const data = await this.service.updateProgress(examRoomId, payload.id, dto);
    sendSuccess({ response, data, message: "Exam session progress updated." });
  });
}
