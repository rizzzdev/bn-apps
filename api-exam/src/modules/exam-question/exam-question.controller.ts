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
import { sendSuccess } from "../../utils/response.js";
import { StatusCode } from "../../types/api.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

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
    sendSuccess({ response, data, message: "Get exam questions data successfully." });
  });

  getById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const query: ExamQuestionGetByIdQuery = {};
    const data = await this.service.getById(id, query);
    sendSuccess({ response, data, message: "Get exam question data successfully." });
  });

  create = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const body: CreateExamQuestionDto = request.body as CreateExamQuestionDto;
    const data = await this.service.create(body);
    sendSuccess({
      response,
      data,
      message: "Create exam question data successfully.",
      statusCode: StatusCode.CREATED,
    });
  });

  updateById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const body: UpdateExamQuestionDto = request.body as UpdateExamQuestionDto;
    const data = await this.service.updateById(id, body);
    sendSuccess({ response, data, message: "Update exam question data successfully." });
  });

  deleteById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const data = await this.service.deleteById(id);
    sendSuccess({ response, data, message: "Delete exam question data successfully." });
  });
}
