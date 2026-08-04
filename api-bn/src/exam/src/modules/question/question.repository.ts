import { type PrismaClient } from "#exam/database/index.js";
import { type Question, type CreateQuestionDto, type UpdateQuestionDto } from "./question.types.js";
import { type IQuestionRepository } from "./question.interface.js";
import { type QuestionGetByIdQuery, type QuestionGetAllQuery } from "./question.query.js";

/**
 * Sentinel value for active (non-deleted) records.
 * The schema uses nullable deletedAt (DateTime?) — null means alive.
 */
const ALIVE: null = null;

/** Handles all Question database operations via Prisma. Contains no business logic. */
export class QuestionRepository implements IQuestionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  getAll = async (query: QuestionGetAllQuery): Promise<Question[]> => {
    const { page = 1, limit = 10 } = query;
    const result = await this.prisma.question.findMany({
      where: {
        deletedAt: ALIVE,
        ...(query.type !== undefined && { type: query.type as Question["type"] }),
      },
      include: {
        options: query.allOptions
          ? { orderBy: { createdAt: "asc" as const } }
          : query.options
            ? { where: { deletedAt: ALIVE }, orderBy: { createdAt: "asc" as const } }
            : false,
        correctAnswer: query.correctAnswer ?? false,
      },
      skip: (page - 1) * limit,
      take: limit,
    });
    return result as unknown as Question[];
  };

  getById = async (id: string, query: QuestionGetByIdQuery): Promise<Question | null> => {
    const result = await this.prisma.question.findFirst({
      where: { id, deletedAt: ALIVE },
      include: {
        options: query.allOptions
          ? { orderBy: { createdAt: "asc" as const } }
          : query.options
            ? { where: { deletedAt: ALIVE }, orderBy: { createdAt: "asc" as const } }
            : false,
        correctAnswer: query.correctAnswer ?? false,
      },
    });
    return result as unknown as Question | null;
  };

  create = async (dto: CreateQuestionDto): Promise<Question> => {
    const result = await this.prisma.question.create({ data: dto });
    return result as unknown as Question;
  };

  updateById = async (id: string, dto: UpdateQuestionDto): Promise<Question> => {
    const result = await this.prisma.question.update({ where: { id }, data: dto });
    return result as unknown as Question;
  };

  deleteById = async (id: string): Promise<Question> => {
    const result = await this.prisma.question.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return result as unknown as Question;
  };
}
