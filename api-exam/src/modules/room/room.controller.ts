import { type Request, type Response } from "express";
import { type IRoomService, type IRoomController } from "./room.interface.js";
import { type CreateRoomDto, type UpdateRoomDto } from "./room.types.js";
import { type RoomGetByIdQuery, type RoomGetAllQuery } from "./room.query.js";
import { sendSuccess } from "../../utils/response.js";
import { StatusCode } from "../../types/api.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

/** Handles HTTP requests for Room endpoints. */
export class RoomController implements IRoomController {
  constructor(private readonly service: IRoomService) {}

  getAll = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const pageParam = request.query.page as string | undefined;
    const limitParam = request.query.limit as string | undefined;
    const nameParam = request.query.name as string | undefined;

    const query: RoomGetAllQuery = {
      page: pageParam !== undefined ? Number(pageParam) : undefined,
      limit: limitParam !== undefined ? Number(limitParam) : undefined,
      name: nameParam,
    };
    const data = await this.service.getAll(query);
    sendSuccess({ response, data, message: "Get rooms data successfully." });
  });

  getById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const query: RoomGetByIdQuery = {};
    const data = await this.service.getById(id, query);
    sendSuccess({ response, data, message: "Get room data successfully." });
  });

  create = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const body: CreateRoomDto = request.body as CreateRoomDto;
    const data = await this.service.create(body);
    sendSuccess({
      response,
      data,
      message: "Create room data successfully.",
      statusCode: StatusCode.CREATED,
    });
  });

  updateById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const body: UpdateRoomDto = request.body as UpdateRoomDto;
    const data = await this.service.updateById(id, body);
    sendSuccess({ response, data, message: "Update room data successfully." });
  });

  deleteById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const data = await this.service.deleteById(id);
    sendSuccess({ response, data, message: "Delete room data successfully." });
  });
}
