import { type Request, type Response } from "express";
import { type IExamAnswerService, type IExamAnswerController } from "./exam-answer.interface.js";
import { type CreateExamAnswerDto, type UpdateExamAnswerDto } from "./exam-answer.types.js";
import { type ExamAnswerGetByIdQuery, type ExamAnswerGetAllQuery } from "./exam-answer.query.js";
import { sendSuccess } from "../../utils/response.js";
import { StatusCode } from "../../types/api.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

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
    sendSuccess({ response, data, message: "Get exam answers data successfully." });
  });

  getById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const query: ExamAnswerGetByIdQuery = {};
    const data = await this.service.getById(id, query);
    sendSuccess({ response, data, message: "Get exam answer data successfully." });
  });

  create = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const body: CreateExamAnswerDto = request.body as CreateExamAnswerDto;
    const data = await this.service.create(body);
    sendSuccess({
      response,
      data,
      message: "Create exam answer data successfully.",
      statusCode: StatusCode.CREATED,
    });
  });

  updateById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const body: UpdateExamAnswerDto = request.body as UpdateExamAnswerDto;
    const data = await this.service.updateById(id, body);
    sendSuccess({ response, data, message: "Update exam answer data successfully." });
  });

  deleteById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const data = await this.service.deleteById(id);
    sendSuccess({ response, data, message: "Delete exam answer data successfully." });
  });
}
