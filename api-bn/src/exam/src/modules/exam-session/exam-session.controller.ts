import { type Request, type Response } from 'express';
import { type ExamSessionService } from './exam-session.service.js';
import { type UpdateProgressDto } from './exam-session.types.js';
import { sendResponse } from '#app';
import { asyncHandler } from '#exam/utils/asyncHandler.js';

export class ExamSessionController {
  constructor(private readonly service: ExamSessionService) {}

  getSession = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const examRoomId = request.params.examRoomId as string;
    const userId = request.user!.id;
    const data = await this.service.getOrCreate(examRoomId, userId);
    sendResponse(response, 200, 'Exam session retrieved successfully.', data);
  });

  updateProgress = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const examRoomId = request.params.examRoomId as string;
    const userId = request.user!.id;
    const dto = request.body as UpdateProgressDto;
    const data = await this.service.updateProgress(examRoomId, userId, dto);
    sendResponse(response, 200, 'Exam session progress updated.', data);
  });
}
