import { type Request, type Response } from "express";
import { type IExamService, type IExamController } from "./exam.interface.js";
import { type CreateExamDto, type UpdateExamDto } from "./exam.types.js";
import { type ExamGetByIdQuery, type ExamGetAllQuery } from "./exam.query.js";
import { sendSuccess } from "../../utils/response.js";
import { StatusCode } from "../../types/api.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

/** Handles HTTP requests for Exam endpoints. */
export class ExamController implements IExamController {
  constructor(private readonly service: IExamService) {}

  getAll = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const pageParam = request.query.page as string | undefined;
    const limitParam = request.query.limit as string | undefined;
    const nameParam = request.query.name as string | undefined;
    const examRoomsParam = request.query.examRooms as string | undefined;
    const questionCreatorIdParam = request.query.questionCreatorId as string | undefined;

    const query: ExamGetAllQuery = {
      page: pageParam !== undefined ? Number(pageParam) : undefined,
      limit: limitParam !== undefined ? Number(limitParam) : undefined,
      name: nameParam,
      examRooms: examRoomsParam === "true",
      questionCreatorId: questionCreatorIdParam,
    };
    const data = await this.service.getAll(query);
    sendSuccess({ response, data, message: "Get exams data successfully." });
  });

  getById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const examRoomsParam = request.query.examRooms as string | undefined;

    const query: ExamGetByIdQuery = {
      examRooms: examRoomsParam === "true",
    };
    const data = await this.service.getById(id, query);
    sendSuccess({ response, data, message: "Get exam data successfully." });
  });

  create = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const body: CreateExamDto = request.body as CreateExamDto;
    const data = await this.service.create(body);
    sendSuccess({
      response,
      data,
      message: "Create exam data successfully.",
      statusCode: StatusCode.CREATED,
    });
  });

  updateById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const body: UpdateExamDto = request.body as UpdateExamDto;
    const data = await this.service.updateById(id, body);
    sendSuccess({ response, data, message: "Update exam data successfully." });
  });

  deleteById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const data = await this.service.deleteById(id);
    sendSuccess({ response, data, message: "Delete exam data successfully." });
  });
}
