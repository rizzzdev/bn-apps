import { type Request, type Response } from "express";
import {
  type IExamParticipantService,
  type IExamParticipantController,
} from "./exam-participant.interface.js";
import {
  type CreateExamParticipantDto,
  type UpdateExamParticipantDto,
} from "./exam-participant.types.js";
import {
  type ExamParticipantGetByIdQuery,
  type ExamParticipantGetAllQuery,
} from "./exam-participant.query.js";
import { sendSuccess } from "../../utils/response.js";
import { StatusCode } from "../../types/api.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

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
    sendSuccess({ response, data, message: "Get exam participants data successfully." });
  });

  getById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const query: ExamParticipantGetByIdQuery = {};
    const data = await this.service.getById(id, query);
    sendSuccess({ response, data, message: "Get exam participant data successfully." });
  });

  create = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const body: CreateExamParticipantDto = request.body as CreateExamParticipantDto;
    const data = await this.service.create(body);
    sendSuccess({
      response,
      data,
      message: "Create exam participant data successfully.",
      statusCode: StatusCode.CREATED,
    });
  });

  updateById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const body: UpdateExamParticipantDto = request.body as UpdateExamParticipantDto;
    const data = await this.service.updateById(id, body);
    sendSuccess({ response, data, message: "Update exam participant data successfully." });
  });

  deleteById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const data = await this.service.deleteById(id);
    sendSuccess({ response, data, message: "Delete exam participant data successfully." });
  });
}
