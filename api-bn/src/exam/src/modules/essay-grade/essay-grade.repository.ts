import { type PrismaClient } from '#exam/database/index.js';
import {
  type EssayGrade,
  type CreateEssayGradeDto,
  type UpdateEssayGradeDto,
} from './essay-grade.types.js';
import { type IEssayGradeRepository } from './essay-grade.interface.js';
import { type EssayGradeGetAllQuery, type EssayGradeGetByIdQuery } from './essay-grade.query.js';

export class EssayGradeRepository implements IEssayGradeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  getAll = async (query: EssayGradeGetAllQuery): Promise<EssayGrade[]> => {
    const { page = 1, limit = 100 } = query;
    return this.prisma.essayGrade.findMany({
      where: {
        ...(query.examRoomId !== undefined && { examRoomId: query.examRoomId }),
        ...(query.userId !== undefined && { userId: query.userId }),
        ...(query.questionId !== undefined && { questionId: query.questionId }),
      },
      skip: (page - 1) * limit,
      take: limit,
    });
  };

  getById = async (id: string, _query: EssayGradeGetByIdQuery): Promise<EssayGrade | null> => {
    return this.prisma.essayGrade.findFirst({ where: { id } });
  };

  getByRoomUserQuestion = async (
    examRoomId: string,
    userId: string,
    questionId: string,
  ): Promise<EssayGrade | null> => {
    return this.prisma.essayGrade.findFirst({ where: { examRoomId, userId, questionId } });
  };

  create = async (dto: CreateEssayGradeDto): Promise<EssayGrade> => {
    return this.prisma.essayGrade.create({ data: dto });
  };

  updateById = async (id: string, dto: UpdateEssayGradeDto): Promise<EssayGrade> => {
    return this.prisma.essayGrade.update({ where: { id }, data: dto });
  };

  deleteById = async (id: string): Promise<EssayGrade> => {
    return this.prisma.essayGrade.delete({ where: { id } });
  };
}
