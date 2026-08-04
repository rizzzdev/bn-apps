import { type Request, type Response } from "express";
import {
  type IQuestionCorrectAnswerService,
  type IQuestionCorrectAnswerController,
} from "./question-correct-answer.interface.js";
import {
  type CreateQuestionCorrectAnswerDto,
  type UpdateQuestionCorrectAnswerDto,
} from "./question-correct-answer.types.js";
import {
  type QuestionCorrectAnswerGetByIdQuery,
  type QuestionCorrectAnswerGetAllQuery,
} from "./question-correct-answer.query.js";
import { sendResponse } from "#app/utils/response.js";
import { asyncHandler } from "#exam/utils/asyncHandler.js";

/** Handles HTTP requests for QuestionCorrectAnswer endpoints. */
export class QuestionCorrectAnswerController implements IQuestionCorrectAnswerController {
  constructor(private readonly service: IQuestionCorrectAnswerService) {}

  getAll = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const pageParam = request.query.page as string | undefined;
    const limitParam = request.query.limit as string | undefined;
    const questionIdParam = request.query.questionId as string | undefined;

    const query: QuestionCorrectAnswerGetAllQuery = {
      page: pageParam !== undefined ? Number(pageParam) : undefined,
      limit: limitParam !== undefined ? Number(limitParam) : undefined,
      questionId: questionIdParam,
    };
    const data = await this.service.getAll(query);
    sendResponse(response, 200, "Get question correct answers data successfully.", data);
  });

  getById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const query: QuestionCorrectAnswerGetByIdQuery = {};
    const data = await this.service.getById(id, query);
    sendResponse(response, 200, "Get question correct answer data successfully.", data);
  });

  create = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const body: CreateQuestionCorrectAnswerDto = request.body as CreateQuestionCorrectAnswerDto;
    const data = await this.service.create(body);
    sendResponse(response, 201, "Create question correct answer data successfully.", data);
  });

  updateById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const body: UpdateQuestionCorrectAnswerDto = request.body as UpdateQuestionCorrectAnswerDto;
    const data = await this.service.updateById(id, body);
    sendResponse(response, 200, "Update question correct answer data successfully.", data);
  });

  deleteById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const data = await this.service.deleteById(id);
    sendResponse(response, 200, "Delete question correct answer data successfully.", data);
  });
}
