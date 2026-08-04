import { type Request, type Response } from "express";
import { type IExamAnswerService, type IExamAnswerController } from "./exam-answer.interface.js";
import { type CreateExamAnswerDto, type UpdateExamAnswerDto } from "./exam-answer.types.js";
import { type ExamAnswerGetByIdQuery, type ExamAnswerGetAllQuery } from "./exam-answer.query.js";
import { sendResponse } from "#app/utils/response.js";
import { asyncHandler } from "#exam/utils/asyncHandler.js";

/** Handles HTTP requests for ExamAnswer endpoints. */
export class ExamAnswerController implements IExamAnswerController {
  constructor(private readonly service: IExamAnswerService) {}

  getAll = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const pageParam = request.query.page as string | undefined;
    const limitParam = request.query.limit as string | undefined;
    const examRoomIdParam = request.query.examRoomId as string | undefined;
    const userIdParam = request.query.userId as string | undefined;
    const questionIdParam = request.query.questionId as string | undefined;

    const query: ExamAnswerGetAllQuery = {
      page: pageParam !== undefined ? Number(pageParam) : undefined,
      limit: limitParam !== undefined ? Number(limitParam) : undefined,
      examRoomId: examRoomIdParam,
      userId: userIdParam,
      questionId: questionIdParam,
    };
    const data = await this.service.getAll(query);
    sendResponse(response, 200, "Get exam answers data successfully.", data);
  });

  getById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const query: ExamAnswerGetByIdQuery = {};
    const data = await this.service.getById(id, query);
    sendResponse(response, 200, "Get exam answer data successfully.", data);
  });

  create = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const body: CreateExamAnswerDto = request.body as CreateExamAnswerDto;
    const data = await this.service.create(body);
    sendResponse(response, 201, "Create exam answer data successfully.", data);
  });

  updateById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const body: UpdateExamAnswerDto = request.body as UpdateExamAnswerDto;
    const data = await this.service.updateById(id, body);
    sendResponse(response, 200, "Update exam answer data successfully.", data);
  });

  deleteById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const data = await this.service.deleteById(id);
    sendResponse(response, 200, "Delete exam answer data successfully.", data);
  });
}
