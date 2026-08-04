import { type PrismaClient } from "../../app/database/generated/client.js";
import {
  type LoginAudit,
  type CreateLoginAuditDto,
  type UpdateLoginAuditDto,
} from "./login-audit.types.js";
import { type ILoginAuditRepository } from "./login-audit.interface.js";
import { type LoginAuditGetByIdQuery, type LoginAuditGetAllQuery } from "./login-audit.query.js";

/** Handles all LoginAudit database operations via Prisma. Contains no business logic. */
export class LoginAuditRepository implements ILoginAuditRepository {
  constructor(private readonly prisma: PrismaClient) {}

  getAll = async (query: LoginAuditGetAllQuery): Promise<LoginAudit[]> => {
    const { page = 1, limit = 10 } = query;
    const result = await this.prisma.loginAudit.findMany({
      where: {
        ...(query.userId !== undefined && { userId: query.userId }),
      },
      include: {
        user: query.user ?? false,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { loginAt: "desc" },
    });
    return result as unknown as LoginAudit[];
  };

  getById = async (id: string, query: LoginAuditGetByIdQuery): Promise<LoginAudit | null> => {
    const result = await this.prisma.loginAudit.findFirst({
      where: { id },
      include: {
        user: query.user ?? false,
      },
    });
    return result as unknown as LoginAudit | null;
  };

  create = async (dto: CreateLoginAuditDto): Promise<LoginAudit> => {
    const result = await this.prisma.loginAudit.create({
      data: {
        ...dto,
        loginAt: dto.loginAt ?? undefined,
        logoutAt: dto.logoutAt ?? undefined,
      },
    });
    return result as unknown as LoginAudit;
  };

  updateById = async (id: string, dto: UpdateLoginAuditDto): Promise<LoginAudit> => {
    const result = await this.prisma.loginAudit.update({
      where: { id },
      data: {
        ...(dto.token !== undefined && { token: dto.token }),
        ...(dto.ipAddress !== undefined && { ipAddress: dto.ipAddress }),
        ...(dto.userAgent !== undefined && { userAgent: dto.userAgent }),
        ...(dto.loginAt !== undefined && { loginAt: dto.loginAt ?? undefined }),
        ...(dto.logoutAt !== undefined && { logoutAt: dto.logoutAt ?? undefined }),
        ...(dto.userId !== undefined && {
          user: { connect: { id: dto.userId } },
        }),
      },
    });
    return result as unknown as LoginAudit;
  };

  /** Hard delete — LoginAudit has no deletedAt field. */
  deleteById = async (id: string): Promise<LoginAudit> => {
    const result = await this.prisma.loginAudit.delete({ where: { id } });
    return result as unknown as LoginAudit;
  };
}
