import { type Request, type Response } from "express";
import { type IOptionService, type IOptionController } from "./option.interface.js";
import { type CreateOptionDto, type UpdateOptionDto } from "./option.types.js";
import { type OptionGetByIdQuery, type OptionGetAllQuery } from "./option.query.js";
import { sendResponse } from "#app/utils/response.js";
import { asyncHandler } from "#exam/utils/asyncHandler.js";

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
    sendResponse(response, 200, "Get options data successfully.", data);
  });

  getById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const query: OptionGetByIdQuery = {};
    const data = await this.service.getById(id, query);
    sendResponse(response, 200, "Get option data successfully.", data);
  });

  create = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const body: CreateOptionDto = request.body as CreateOptionDto;
    const data = await this.service.create(body);
    sendResponse(response, 201, "Create option data successfully.", data);
  });

  updateById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const body: UpdateOptionDto = request.body as UpdateOptionDto;
    const data = await this.service.updateById(id, body);
    sendResponse(response, 200, "Update option data successfully.", data);
  });

  deleteById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const data = await this.service.deleteById(id);
    sendResponse(response, 200, "Delete option data successfully.", data);
  });
}
