import { type Request, type Response } from "express";
import { type IOptionService, type IOptionController } from "./option.interface.js";
import { type CreateOptionDto, type UpdateOptionDto } from "./option.types.js";
import { type OptionGetByIdQuery, type OptionGetAllQuery } from "./option.query.js";
import { sendSuccess } from "../../utils/response.js";
import { StatusCode } from "../../types/api.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

/** Handles HTTP requests for Option endpoints. */
export class OptionController implements IOptionController {
  constructor(private readonly service: IOptionService) {}

  getAll = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const pageParam = request.query.page as string | undefined;
    const limitParam = request.query.limit as string | undefined;
    const questionIdParam = request.query.questionId as string | undefined;

    const query: OptionGetAllQuery = {
      page: pageParam !== undefined ? Number(pageParam) : undefined,
      limit: limitParam !== undefined ? Number(limitParam) : undefined,
      questionId: questionIdParam,
    };
    const data = await this.service.getAll(query);
    sendSuccess({ response, data, message: "Get options data successfully." });
  });

  getById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const query: OptionGetByIdQuery = {};
    const data = await this.service.getById(id, query);
    sendSuccess({ response, data, message: "Get option data successfully." });
  });

  create = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const body: CreateOptionDto = request.body as CreateOptionDto;
    const data = await this.service.create(body);
    sendSuccess({
      response,
      data,
      message: "Create option data successfully.",
      statusCode: StatusCode.CREATED,
    });
  });

  updateById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const body: UpdateOptionDto = request.body as UpdateOptionDto;
    const data = await this.service.updateById(id, body);
    sendSuccess({ response, data, message: "Update option data successfully." });
  });

  deleteById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const data = await this.service.deleteById(id);
    sendSuccess({ response, data, message: "Delete option data successfully." });
  });
}
