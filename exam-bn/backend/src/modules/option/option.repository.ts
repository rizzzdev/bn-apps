import { type PrismaClient } from "../../app/database/generated/client.js";
import { type Option, type CreateOptionDto, type UpdateOptionDto } from "./option.types.js";
import { type IOptionRepository } from "./option.interface.js";
import { type OptionGetByIdQuery, type OptionGetAllQuery } from "./option.query.js";
import { ALIVE } from "../../utils/constants.js";

/** Handles all Option database operations via Prisma. Contains no business logic. */
export class OptionRepository implements IOptionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  getAll = async (query: OptionGetAllQuery): Promise<Option[]> => {
    const { page = 1, limit = 10 } = query;
    return this.prisma.option.findMany({
      where: {
        deletedAt: ALIVE,
        ...(query.questionId !== undefined && { questionId: query.questionId }),
      },
      skip: (page - 1) * limit,
      take: limit,
    });
  };

  getById = async (id: string, _query: OptionGetByIdQuery): Promise<Option | null> => {
    return this.prisma.option.findFirst({ where: { id, deletedAt: ALIVE } });
  };

  create = async (dto: CreateOptionDto): Promise<Option> => {
    return this.prisma.option.create({ data: dto });
  };

  updateById = async (id: string, dto: UpdateOptionDto): Promise<Option> => {
    return this.prisma.option.update({ where: { id }, data: dto });
  };

  deleteById = async (id: string): Promise<Option> => {
    return this.prisma.option.update({ where: { id }, data: { deletedAt: new Date() } });
  };
}
