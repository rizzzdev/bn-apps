import { type PrismaClient } from "#exam/database/index.js";
import {
  type ExamScore,
  type CreateExamScoreDto,
  type UpdateExamScoreDto,
} from "./exam-score.types.js";
import { type IExamScoreRepository } from "./exam-score.interface.js";
import { type ExamScoreGetByIdQuery, type ExamScoreGetAllQuery } from "./exam-score.query.js";

/** Handles all ExamScore database operations via Prisma. Contains no business logic. */
export class ExamScoreRepository implements IExamScoreRepository {
  constructor(private readonly prisma: PrismaClient) {}

  getAll = async (query: ExamScoreGetAllQuery): Promise<ExamScore[]> => {
    const { page = 1, limit = 10 } = query;
    return this.prisma.examScore.findMany({
      where: {
        ...(query.examRoomId !== undefined && { examRoomId: query.examRoomId }),
        ...(query.userId !== undefined && { userId: query.userId }),
      },
      skip: (page - 1) * limit,
      take: limit,
    });
  };

  getById = async (id: string, _query: ExamScoreGetByIdQuery): Promise<ExamScore | null> => {
    return this.prisma.examScore.findFirst({ where: { id } });
  };

  getByRoomAndUser = async (examRoomId: string, userId: string): Promise<ExamScore | null> => {
    return this.prisma.examScore.findFirst({ where: { examRoomId, userId } });
  };

  create = async (dto: CreateExamScoreDto): Promise<ExamScore> => {
    return this.prisma.examScore.create({ data: dto });
  };

  updateById = async (id: string, dto: UpdateExamScoreDto): Promise<ExamScore> => {
    return this.prisma.examScore.update({ where: { id }, data: dto });
  };

  /** Hard delete — ExamScore has no deletedAt field. */
  deleteById = async (id: string): Promise<ExamScore> => {
    return this.prisma.examScore.delete({ where: { id } });
  };
}
