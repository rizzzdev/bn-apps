import { type Request, type Response } from "express";
import { type ILoginAuditService, type ILoginAuditController } from "./login-audit.interface.js";
import { type CreateLoginAuditDto, type UpdateLoginAuditDto } from "./login-audit.types.js";
import { type LoginAuditGetByIdQuery, type LoginAuditGetAllQuery } from "./login-audit.query.js";
import { sendSuccess } from "../../utils/response.js";
import { StatusCode } from "../../types/api.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

/** Handles HTTP requests for LoginAudit endpoints. */
export class LoginAuditController implements ILoginAuditController {
  constructor(private readonly service: ILoginAuditService) {}

  getAll = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const pageParam = request.query.page as string | undefined;
    const limitParam = request.query.limit as string | undefined;
    const userIdParam = request.query.userId as string | undefined;
    const userParam = request.query.user as string | undefined;

    const query: LoginAuditGetAllQuery = {
      page: pageParam !== undefined ? Number(pageParam) : undefined,
      limit: limitParam !== undefined ? Number(limitParam) : undefined,
      userId: userIdParam,
      user: userParam === "true",
    };
    const data = await this.service.getAll(query);
    sendSuccess({ response, data, message: "Get login audits data successfully." });
  });

  getById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const userParam = request.query.user as string | undefined;

    const query: LoginAuditGetByIdQuery = {
      user: userParam === "true",
    };
    const data = await this.service.getById(id, query);
    sendSuccess({ response, data, message: "Get login audit data successfully." });
  });

  create = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const body: CreateLoginAuditDto = request.body as CreateLoginAuditDto;
    const data = await this.service.create(body);
    sendSuccess({
      response,
      data,
      message: "Create login audit data successfully.",
      statusCode: StatusCode.CREATED,
    });
  });

  updateById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const body: UpdateLoginAuditDto = request.body as UpdateLoginAuditDto;
    const data = await this.service.updateById(id, body);
    sendSuccess({ response, data, message: "Update login audit data successfully." });
  });

  deleteById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const data = await this.service.deleteById(id);
    sendSuccess({ response, data, message: "Delete login audit data successfully." });
  });
}
