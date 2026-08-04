import { type PrismaClient } from "#exam/database/index.js";
import {
  type ExamQuestion,
  type CreateExamQuestionDto,
  type UpdateExamQuestionDto,
} from "./exam-question.types.js";
import { type IExamQuestionRepository } from "./exam-question.interface.js";
import {
  type ExamQuestionGetByIdQuery,
  type ExamQuestionGetAllQuery,
} from "./exam-question.query.js";

/**
 * Sentinel value for active (non-deleted) records.
 * The schema uses nullable deletedAt (DateTime?) — null means alive.
 */
const ALIVE: null = null;

/** Handles all ExamQuestion database operations via Prisma. Contains no business logic. */
export class ExamQuestionRepository implements IExamQuestionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  getAll = async (query: ExamQuestionGetAllQuery): Promise<ExamQuestion[]> => {
    const { page = 1, limit = 10 } = query;
    return this.prisma.examQuestion.findMany({
      where: {
        deletedAt: ALIVE,
        ...(query.examRoomId !== undefined && { examRoomId: query.examRoomId }),
        ...(query.questionId !== undefined && { questionId: query.questionId }),
      },
      include: {
        question: {
          include: {
            options: {
              where: { deletedAt: ALIVE },
            },
          },
        },
      },
      orderBy: { questionNumber: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    });
  };

  getById = async (id: string, _query: ExamQuestionGetByIdQuery): Promise<ExamQuestion | null> => {
    return this.prisma.examQuestion.findFirst({ where: { id, deletedAt: ALIVE } });
  };

  getByRoomAndQuestion = async (
    examRoomId: string,
    questionId: string,
  ): Promise<ExamQuestion | null> => {
    return this.prisma.examQuestion.findFirst({
      where: { examRoomId, questionId, deletedAt: ALIVE },
    });
  };

  getByRoomAndNumber = async (
    examRoomId: string,
    questionNumber: number,
  ): Promise<ExamQuestion | null> => {
    return this.prisma.examQuestion.findFirst({
      where: { examRoomId, questionNumber, deletedAt: ALIVE },
    });
  };

  create = async (dto: CreateExamQuestionDto): Promise<ExamQuestion> => {
    return this.prisma.examQuestion.create({ data: dto });
  };

  updateById = async (id: string, dto: UpdateExamQuestionDto): Promise<ExamQuestion> => {
    return this.prisma.examQuestion.update({ where: { id }, data: dto });
  };

  deleteById = async (id: string): Promise<ExamQuestion> => {
    return this.prisma.examQuestion.update({ where: { id }, data: { deletedAt: new Date() } });
  };
}
