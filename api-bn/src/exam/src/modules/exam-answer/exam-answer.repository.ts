import { type PrismaClient } from "#exam/database/index.js";
import {
  type ExamAnswer,
  type CreateExamAnswerDto,
  type UpdateExamAnswerDto,
} from "./exam-answer.types.js";
import { type IExamAnswerRepository } from "./exam-answer.interface.js";
import { type ExamAnswerGetByIdQuery, type ExamAnswerGetAllQuery } from "./exam-answer.query.js";

/** Handles all ExamAnswer database operations via Prisma. Contains no business logic. */
export class ExamAnswerRepository implements IExamAnswerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  getAll = async (query: ExamAnswerGetAllQuery): Promise<ExamAnswer[]> => {
    const { page = 1, limit = 10 } = query;
    return this.prisma.examAnswer.findMany({
      where: {
        ...(query.examRoomId !== undefined && { examRoomId: query.examRoomId }),
        ...(query.userId !== undefined && { userId: query.userId }),
        ...(query.questionId !== undefined && { questionId: query.questionId }),
      },
      skip: (page - 1) * limit,
      take: limit,
    });
  };

  getById = async (id: string, _query: ExamAnswerGetByIdQuery): Promise<ExamAnswer | null> => {
    return this.prisma.examAnswer.findFirst({ where: { id } });
  };

  getByRoomUserQuestion = async (
    examRoomId: string,
    userId: string,
    questionId: string,
  ): Promise<ExamAnswer | null> => {
    return this.prisma.examAnswer.findFirst({ where: { examRoomId, userId, questionId } });
  };

  create = async (dto: CreateExamAnswerDto): Promise<ExamAnswer> => {
    const existing = await this.prisma.examAnswer.findFirst({
      where: { examRoomId: dto.examRoomId, userId: dto.userId, questionId: dto.questionId },
    });
    if (existing) {
      return this.prisma.examAnswer.update({
        where: { id: existing.id },
        data: {
          optionId: dto.optionId !== undefined ? dto.optionId : existing.optionId,
          text: dto.text !== undefined ? dto.text : existing.text,
          updatedAt: new Date(),
        },
      });
    }
    return this.prisma.examAnswer.create({ data: dto });
  };

  updateById = async (id: string, dto: UpdateExamAnswerDto): Promise<ExamAnswer> => {
    return this.prisma.examAnswer.update({ where: { id }, data: dto });
  };

  /** Hard delete — ExamAnswer has no deletedAt field. */
  deleteById = async (id: string): Promise<ExamAnswer> => {
    return this.prisma.examAnswer.delete({ where: { id } });
  };
}
