import { type PrismaClient } from "../../app/database/generated/client.js";
import { type User, type CreateUserDto, type UpdateUserDto } from "./user.types.js";
import { type IUserRepository } from "./user.interface.js";
import { type UserGetByIdQuery, type UserGetAllQuery } from "./user.query.js";
import { ALIVE } from "../../utils/constants.js";

/** Handles all User database operations via Prisma. Contains no business logic. */
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  getAll = async (query: UserGetAllQuery): Promise<User[]> => {
    const { page = 1, limit = 10 } = query;
    const result = await this.prisma.user.findMany({
      where: {
        deletedAt: ALIVE,
        ...(query.username !== undefined && { username: query.username }),
        ...(query.role !== undefined && { role: query.role as User["role"] }),
      },
      include: {
        loginAudits: query.loginAudits ?? false,
        examParticipants: query.examParticipants ?? false,
        examSupervisors: query.examSupervisors ?? false,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return result as unknown as User[];
  };

  getById = async (id: string, query: UserGetByIdQuery): Promise<User | null> => {
    const result = await this.prisma.user.findFirst({
      where: { id, deletedAt: ALIVE },
      include: {
        loginAudits: query.loginAudits ?? false,
        examParticipants: query.examParticipants ?? false,
        examSupervisors: query.examSupervisors ?? false,
      },
    });
    return result as unknown as User | null;
  };

  getByUsername = async (username: string): Promise<User | null> => {
    const result = await this.prisma.user.findFirst({ where: { username, deletedAt: ALIVE } });
    return result as unknown as User | null;
  };

  create = async (dto: CreateUserDto): Promise<User> => {
    const result = await this.prisma.user.create({ data: dto });
    return result as unknown as User;
  };

  updateById = async (id: string, dto: UpdateUserDto): Promise<User> => {
    const result = await this.prisma.user.update({ where: { id }, data: dto });
    return result as unknown as User;
  };

  deleteById = async (id: string): Promise<User> => {
    const result = await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return result as unknown as User;
  };
}
