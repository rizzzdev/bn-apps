import { type Request, type Response } from 'express';
import { type IExamRoomService, type IExamRoomController } from './exam-room.interface.js';
import { type CreateExamRoomDto, type UpdateExamRoomDto } from './exam-room.types.js';
import { type ExamRoomGetByIdQuery, type ExamRoomGetAllQuery } from './exam-room.query.js';
import { sendResponse } from '#app/index.js';
import { asyncHandler } from '#exam/utils/asyncHandler.js';

/** Handles HTTP requests for ExamRoom endpoints. */
export class ExamRoomController implements IExamRoomController {
  constructor(private readonly service: IExamRoomService) {}

  getAll = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const pageParam = request.query.page as string | undefined;
    const limitParam = request.query.limit as string | undefined;
    const examIdParam = request.query.examId as string | undefined;
    const roomIdParam = request.query.roomId as string | undefined;

    const query: ExamRoomGetAllQuery = {
      page: pageParam !== undefined ? Number(pageParam) : undefined,
      limit: limitParam !== undefined ? Number(limitParam) : undefined,
      examId: examIdParam,
      roomId: roomIdParam,
    };
    const data = await this.service.getAll(query);
    sendResponse(response, 200, 'Get exam rooms data successfully.', data);
  });

  getById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const query: ExamRoomGetByIdQuery = {};
    const data = await this.service.getById(id, query);
    sendResponse(response, 200, 'Get exam room data successfully.', data);
  });

  create = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const body: CreateExamRoomDto = request.body as CreateExamRoomDto;
    const data = await this.service.create(body);
    sendResponse(response, 201, 'Create exam room data successfully.', data);
  });

  updateById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const body: UpdateExamRoomDto = request.body as UpdateExamRoomDto;
    const data = await this.service.updateById(id, body);
    sendResponse(response, 200, 'Update exam room data successfully.', data);
  });

  deleteById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const data = await this.service.deleteById(id);
    sendResponse(response, 200, 'Delete exam room data successfully.', data);
  });

  getParticipantsStatus = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const { getRoomParticipantStatuses } = await import('#exam/socket/socket.handler.js');
    const data = await getRoomParticipantStatuses(id);
    sendResponse(response, 200, 'Get exam room participant statuses successfully.', data);
  });
}
