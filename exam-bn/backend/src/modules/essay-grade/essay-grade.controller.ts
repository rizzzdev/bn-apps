import { type Request, type Response } from "express";
import { type IEssayGradeService } from "./essay-grade.interface.js";
import { type CreateEssayGradeDto, type UpdateEssayGradeDto } from "./essay-grade.types.js";
import { type EssayGradeGetAllQuery } from "./essay-grade.query.js";
import { sendSuccess } from "../../utils/response.js";
import { StatusCode } from "../../types/api.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export class EssayGradeController {
  constructor(private readonly service: IEssayGradeService) {}

  getAll = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const query: EssayGradeGetAllQuery = {
      page: request.query.page !== undefined ? Number(request.query.page) : undefined,
      limit: request.query.limit !== undefined ? Number(request.query.limit) : undefined,
      examRoomId: request.query.examRoomId as string | undefined,
      userId: request.query.userId as string | undefined,
      questionId: request.query.questionId as string | undefined,
    };
    const data = await this.service.getAll(query);
    sendSuccess({ response, data, message: "Get essay grades successfully." });
  });

  getById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id = request.params.id as string;
    const data = await this.service.getById(id, {});
    sendSuccess({ response, data, message: "Get essay grade successfully." });
  });

  upsert = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const body = request.body as CreateEssayGradeDto;
    const data = await this.service.upsert(body);
    sendSuccess({
      response,
      data,
      message: "Essay grade saved successfully.",
      statusCode: StatusCode.CREATED,
    });
  });

  updateById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id = request.params.id as string;
    const body = request.body as UpdateEssayGradeDto;
    const data = await this.service.updateById(id, body);
    sendSuccess({ response, data, message: "Essay grade updated successfully." });
  });

  deleteById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id = request.params.id as string;
    const data = await this.service.deleteById(id);
    sendSuccess({ response, data, message: "Essay grade deleted successfully." });
  });
}
