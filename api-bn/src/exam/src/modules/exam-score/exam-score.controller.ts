import { type Request, type Response } from "express";
import { type IExamScoreService, type IExamScoreController } from "./exam-score.interface.js";
import { type CreateExamScoreDto, type UpdateExamScoreDto } from "./exam-score.types.js";
import { type ExamScoreGetByIdQuery, type ExamScoreGetAllQuery } from "./exam-score.query.js";
import { sendResponse } from "#app/utils/response.js";
import { asyncHandler } from "#exam/utils/asyncHandler.js";

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
    sendResponse(response, 200, "Get exam scores data successfully.", data);
  });

  getById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const query: ExamScoreGetByIdQuery = {};
    const data = await this.service.getById(id, query);
    sendResponse(response, 200, "Get exam score data successfully.", data);
  });

  create = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const body: CreateExamScoreDto = request.body as CreateExamScoreDto;
    const data = await this.service.create(body);
    sendResponse(response, 201, "Create exam score data successfully.", data);
  });

  updateById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const body: UpdateExamScoreDto = request.body as UpdateExamScoreDto;
    const data = await this.service.updateById(id, body);
    sendResponse(response, 200, "Update exam score data successfully.", data);
  });

  deleteById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const data = await this.service.deleteById(id);
    sendResponse(response, 200, "Delete exam score data successfully.", data);
  });
}
