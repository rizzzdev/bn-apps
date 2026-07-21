import { type Request, type Response } from "express";
import { type IExamScoreService, type IExamScoreController } from "./exam-score.interface.js";
import { type CreateExamScoreDto, type UpdateExamScoreDto } from "./exam-score.types.js";
import { type ExamScoreGetByIdQuery, type ExamScoreGetAllQuery } from "./exam-score.query.js";
import { sendSuccess } from "../../utils/response.js";
import { StatusCode } from "../../types/api.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

/** Handles HTTP requests for ExamScore endpoints. */
export class ExamScoreController implements IExamScoreController {
  constructor(private readonly service: IExamScoreService) {}

  getAll = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const pageParam = request.query.page as string | undefined;
    const limitParam = request.query.limit as string | undefined;
    const examRoomIdParam = request.query.examRoomId as string | undefined;
    const userIdParam = request.query.userId as string | undefined;

    const query: ExamScoreGetAllQuery = {
      page: pageParam !== undefined ? Number(pageParam) : undefined,
      limit: limitParam !== undefined ? Number(limitParam) : undefined,
      examRoomId: examRoomIdParam,
      userId: userIdParam,
    };
    const data = await this.service.getAll(query);
    sendSuccess({ response, data, message: "Get exam scores data successfully." });
  });

  getById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const query: ExamScoreGetByIdQuery = {};
    const data = await this.service.getById(id, query);
    sendSuccess({ response, data, message: "Get exam score data successfully." });
  });

  create = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const body: CreateExamScoreDto = request.body as CreateExamScoreDto;
    const data = await this.service.create(body);
    sendSuccess({
      response,
      data,
      message: "Create exam score data successfully.",
      statusCode: StatusCode.CREATED,
    });
  });

  updateById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const body: UpdateExamScoreDto = request.body as UpdateExamScoreDto;
    const data = await this.service.updateById(id, body);
    sendSuccess({ response, data, message: "Update exam score data successfully." });
  });

  deleteById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const data = await this.service.deleteById(id);
    sendSuccess({ response, data, message: "Delete exam score data successfully." });
  });
}
