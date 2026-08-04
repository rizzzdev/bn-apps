import { type Request, type Response } from "express";
import { type IUserService, type IUserController } from "./user.interface.js";
import {
  type CreateUserDto,
  type UpdateUserDto,
  type UserRole,
  UserRoleValues,
} from "./user.types.js";
import { type UserGetByIdQuery, type UserGetAllQuery } from "./user.query.js";
import { sendSuccess } from "../../utils/response.js";
import { StatusCode } from "../../types/api.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { BadRequestError } from "../../utils/errors.js";
import * as XLSX from "xlsx";

/** Handles HTTP requests for User endpoints. Delegates all logic to the service layer. */
export class UserController implements IUserController {
  constructor(private readonly service: IUserService) {}

  getAll = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const pageParam = request.query.page as string | undefined;
    const limitParam = request.query.limit as string | undefined;
    const usernameParam = request.query.username as string | undefined;
    const roleParam = request.query.role as string | undefined;
    const loginAuditsParam = request.query.loginAudits as string | undefined;
    const examParticipantsParam = request.query.examParticipants as string | undefined;
    const examSupervisorsParam = request.query.examSupervisors as string | undefined;

    const query: UserGetAllQuery = {
      page: pageParam !== undefined ? Number(pageParam) : undefined,
      limit: limitParam !== undefined ? Number(limitParam) : undefined,
      username: usernameParam,
      role: roleParam,
      loginAudits: loginAuditsParam === "true",
      examParticipants: examParticipantsParam === "true",
      examSupervisors: examSupervisorsParam === "true",
    };
    const data = await this.service.getAll(query);
    sendSuccess({ response, data, message: "Get users data successfully." });
  });

  getById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const loginAuditsParam = request.query.loginAudits as string | undefined;
    const examParticipantsParam = request.query.examParticipants as string | undefined;
    const examSupervisorsParam = request.query.examSupervisors as string | undefined;

    const query: UserGetByIdQuery = {
      loginAudits: loginAuditsParam === "true",
      examParticipants: examParticipantsParam === "true",
      examSupervisors: examSupervisorsParam === "true",
    };
    const data = await this.service.getById(id, query);
    sendSuccess({ response, data, message: "Get user data successfully." });
  });

  create = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const body: CreateUserDto = request.body as CreateUserDto;
    const data = await this.service.create(body);
    sendSuccess({
      response,
      data,
      message: "Create user data successfully.",
      statusCode: StatusCode.CREATED,
    });
  });

  updateById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const body: UpdateUserDto = request.body as UpdateUserDto;
    const data = await this.service.updateById(id, body);
    sendSuccess({ response, data, message: "Update user data successfully." });
  });

  deleteById = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const id: string = request.params.id as string;
    const data = await this.service.deleteById(id);
    sendSuccess({ response, data, message: "Delete user data successfully." });
  });

  downloadTemplate = (_request: Request, response: Response): void => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["fullname", "username", "password"],
      ["Nama Lengkap Contoh", "username_contoh", "password123"],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
    response.setHeader("Content-Disposition", 'attachment; filename="template_user.xlsx"');
    response.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    response.send(buf);
  };

  importExcel = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const file = (request as Request & { file?: Express.Multer.File }).file;
    if (!file) throw new BadRequestError("File Excel wajib diupload.");

    const role = request.body.role as string;
    if (!role || !UserRoleValues.includes(role as UserRole)) {
      throw new BadRequestError("Role tidak valid. Gunakan ADMIN, SUPERVISOR, atau PARTICIPANT.");
    }

    const workbook = XLSX.read(file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    if (rows.length === 0) throw new BadRequestError("File Excel kosong atau tidak memiliki data.");

    const dtos: CreateUserDto[] = rows.map((row, i) => {
      const fullname = String(
        row["fullname"] ?? row["Nama Lengkap"] ?? row["nama_lengkap"] ?? "",
      ).trim();
      const username = String(row["username"] ?? row["Username"] ?? "").trim();
      const passwordHash = String(row["password"] ?? row["Password"] ?? "").trim();
      if (!fullname || !username || !passwordHash) {
        throw new BadRequestError(
          `Baris ${i + 2}: kolom fullname, username, password wajib diisi.`,
        );
      }
      return { fullname, username, passwordHash, role: role as UserRole };
    });

    const result = await this.service.importMany(dtos);
    sendSuccess({
      response,
      data: result,
      message: `Import selesai. ${result.created} user berhasil dibuat.`,
      statusCode: StatusCode.CREATED,
    });
  });
}
