import { type Request, type Response } from 'express';
import {
  type IExamParticipantService,
  type IExamParticipantController,
} from './exam-participant.interface.js';
import {
  type CreateExamParticipantDto,
  type UpdateExamParticipantDto,
} from './exam-participant.types.js';
import {
  type ExamParticipantGetByIdQuery,
  type ExamParticipantGetAllQuery,
} from './exam-participant.query.js';
import { sendResponse } from '#app/index.js';
import { asyncHandler } from '#exam/utils/asyncHandler.js';

/** Handles HTTP requests for ExamParticipant endpoints. */
export class ExamParticipantController implements IExamParticipantController {
  constructor(private readonly service: IExamParticipantService) {}

  getAll = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const pageParam = request.query.page as string | undefined;
    const limitParam = request.query.limit as string | undefined;
    const examRoomIdParam = request.query.examRoomId as string | undefined;
    const userIdParam = request.query.userId as string | undefined;

    const query: ExamParticipantGetAllQuery = {
      page: pageParam !== undefined ? Number(pageParam) : undefined,
      limit: limitParam !== undefined ? Number(limitParam) : undefined,
      examRoomId: examRoomIdParam,
      userId: userIdParam,
    };
    const data = await this.service.getAll(query);
    sendResponse(response, 200, 'Get exam participants data successfully.', data);
  });

  getById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const query: ExamParticipantGetByIdQuery = {};
    const data = await this.service.getById(id, query);
    sendResponse(response, 200, 'Get exam participant data successfully.', data);
  });

  create = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const body: CreateExamParticipantDto = request.body as CreateExamParticipantDto;
    const data = await this.service.create(body);
    sendResponse(response, 201, 'Create exam participant data successfully.', data);
  });

  updateById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const body: UpdateExamParticipantDto = request.body as UpdateExamParticipantDto;
    const data = await this.service.updateById(id, body);
    sendResponse(response, 200, 'Update exam participant data successfully.', data);
  });

  deleteById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const data = await this.service.deleteById(id);
    sendResponse(response, 200, 'Delete exam participant data successfully.', data);
  });
}
