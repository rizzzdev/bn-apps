import { type Request, type Response } from "express";
import {
  type IExamQuestionService,
  type IExamQuestionController,
} from "./exam-question.interface.js";
import { type CreateExamQuestionDto, type UpdateExamQuestionDto } from "./exam-question.types.js";
import {
  type ExamQuestionGetByIdQuery,
  type ExamQuestionGetAllQuery,
} from "./exam-question.query.js";
import { sendResponse } from "#app/utils/response.js";
import { asyncHandler } from "#exam/utils/asyncHandler.js";

/** Handles HTTP requests for ExamQuestion endpoints. */
export class ExamQuestionController implements IExamQuestionController {
  constructor(private readonly service: IExamQuestionService) {}

  getAll = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const pageParam = request.query.page as string | undefined;
    const limitParam = request.query.limit as string | undefined;
    const examRoomIdParam = request.query.examRoomId as string | undefined;
    const questionIdParam = request.query.questionId as string | undefined;

    const query: ExamQuestionGetAllQuery = {
      page: pageParam !== undefined ? Number(pageParam) : undefined,
      limit: limitParam !== undefined ? Number(limitParam) : undefined,
      examRoomId: examRoomIdParam,
      questionId: questionIdParam,
    };
    const data = await this.service.getAll(query);
    sendResponse(response, 200, "Get exam questions data successfully.", data);
  });

  getById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const query: ExamQuestionGetByIdQuery = {};
    const data = await this.service.getById(id, query);
    sendResponse(response, 200, "Get exam question data successfully.", data);
  });

  create = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const body: CreateExamQuestionDto = request.body as CreateExamQuestionDto;
    const data = await this.service.create(body);
    sendResponse(response, 201, "Create exam question data successfully.", data);
  });

  updateById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const body: UpdateExamQuestionDto = request.body as UpdateExamQuestionDto;
    const data = await this.service.updateById(id, body);
    sendResponse(response, 200, "Update exam question data successfully.", data);
  });

  deleteById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const data = await this.service.deleteById(id);
    sendResponse(response, 200, "Delete exam question data successfully.", data);
  });
}
