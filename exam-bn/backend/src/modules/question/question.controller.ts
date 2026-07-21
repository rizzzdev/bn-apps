import { type Request, type Response } from "express";
import { type IQuestionService, type IQuestionController } from "./question.interface.js";
import { type CreateQuestionDto, type UpdateQuestionDto } from "./question.types.js";
import { type QuestionGetByIdQuery, type QuestionGetAllQuery } from "./question.query.js";
import { sendSuccess } from "../../utils/response.js";
import { StatusCode } from "../../types/api.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

/** Handles HTTP requests for Question endpoints. */
export class QuestionController implements IQuestionController {
  constructor(private readonly service: IQuestionService) {}

  getAll = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const pageParam = request.query.page as string | undefined;
    const limitParam = request.query.limit as string | undefined;
    const typeParam = request.query.type as string | undefined;
    const optionsParam = request.query.options as string | undefined;
    const allOptionsParam = request.query.allOptions as string | undefined;
    const correctAnswerParam = request.query.correctAnswer as string | undefined;

    const query: QuestionGetAllQuery = {
      page: pageParam !== undefined ? Number(pageParam) : undefined,
      limit: limitParam !== undefined ? Number(limitParam) : undefined,
      type: typeParam,
      options: optionsParam === "true",
      allOptions: allOptionsParam === "true",
      correctAnswer: correctAnswerParam === "true",
    };
    const data = await this.service.getAll(query);
    sendSuccess({ response, data, message: "Get questions data successfully." });
  });

  getById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const optionsParam = request.query.options as string | undefined;
    const correctAnswerParam = request.query.correctAnswer as string | undefined;

    const query: QuestionGetByIdQuery = {
      options: optionsParam === "true",
      correctAnswer: correctAnswerParam === "true",
    };
    const data = await this.service.getById(id, query);
    sendSuccess({ response, data, message: "Get question data successfully." });
  });

  create = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const body: CreateQuestionDto = request.body as CreateQuestionDto;
    const data = await this.service.create(body);
    sendSuccess({
      response,
      data,
      message: "Create question data successfully.",
      statusCode: StatusCode.CREATED,
    });
  });

  updateById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const body: UpdateQuestionDto = request.body as UpdateQuestionDto;
    const data = await this.service.updateById(id, body);
    sendSuccess({ response, data, message: "Update question data successfully." });
  });

  deleteById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const data = await this.service.deleteById(id);
    sendSuccess({ response, data, message: "Delete question data successfully." });
  });
}
