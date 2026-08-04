import { type Request, type Response } from "express";
import { type IExamRoomService, type IExamRoomController } from "./exam-room.interface.js";
import { type CreateExamRoomDto, type UpdateExamRoomDto } from "./exam-room.types.js";
import { type ExamRoomGetByIdQuery, type ExamRoomGetAllQuery } from "./exam-room.query.js";
import { sendSuccess } from "../../utils/response.js";
import { StatusCode } from "../../types/api.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

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
    sendSuccess({ response, data, message: "Get exam rooms data successfully." });
  });

  getById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const query: ExamRoomGetByIdQuery = {};
    const data = await this.service.getById(id, query);
    sendSuccess({ response, data, message: "Get exam room data successfully." });
  });

  create = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const body: CreateExamRoomDto = request.body as CreateExamRoomDto;
    const data = await this.service.create(body);
    sendSuccess({
      response,
      data,
      message: "Create exam room data successfully.",
      statusCode: StatusCode.CREATED,
    });
  });

  updateById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const body: UpdateExamRoomDto = request.body as UpdateExamRoomDto;
    const data = await this.service.updateById(id, body);
    sendSuccess({ response, data, message: "Update exam room data successfully." });
  });

  deleteById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const data = await this.service.deleteById(id);
    sendSuccess({ response, data, message: "Delete exam room data successfully." });
  });

  getParticipantsStatus = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const { getRoomParticipantStatuses } = await import("../../socket/socket.handler.js");
    const data = await getRoomParticipantStatuses(id);
    sendSuccess({ response, data, message: "Get exam room participant statuses successfully." });
  });
}
