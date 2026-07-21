import { type PrismaClient } from "../../app/database/generated/client.js";
import {
  type QuestionCorrectAnswer,
  type CreateQuestionCorrectAnswerDto,
  type UpdateQuestionCorrectAnswerDto,
} from "./question-correct-answer.types.js";
import { type IQuestionCorrectAnswerRepository } from "./question-correct-answer.interface.js";
import {
  type QuestionCorrectAnswerGetByIdQuery,
  type QuestionCorrectAnswerGetAllQuery,
} from "./question-correct-answer.query.js";

/** Handles all QuestionCorrectAnswer database operations via Prisma. Contains no business logic. */
export class QuestionCorrectAnswerRepository implements IQuestionCorrectAnswerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  getAll = async (query: QuestionCorrectAnswerGetAllQuery): Promise<QuestionCorrectAnswer[]> => {
    const { page = 1, limit = 10 } = query;
    return this.prisma.questionCorrectAnswer.findMany({
      where: {
        ...(query.questionId !== undefined && { questionId: query.questionId }),
      },
      skip: (page - 1) * limit,
      take: limit,
    });
  };

  getById = async (
    id: string,
    _query: QuestionCorrectAnswerGetByIdQuery,
  ): Promise<QuestionCorrectAnswer | null> => {
    return this.prisma.questionCorrectAnswer.findFirst({ where: { id } });
  };

  getByQuestionId = async (questionId: string): Promise<QuestionCorrectAnswer | null> => {
    return this.prisma.questionCorrectAnswer.findFirst({ where: { questionId } });
  };

  create = async (dto: CreateQuestionCorrectAnswerDto): Promise<QuestionCorrectAnswer> => {
    return this.prisma.questionCorrectAnswer.create({ data: dto });
  };

  updateById = async (
    id: string,
    dto: UpdateQuestionCorrectAnswerDto,
  ): Promise<QuestionCorrectAnswer> => {
    return this.prisma.questionCorrectAnswer.update({ where: { id }, data: dto });
  };

  /** Hard delete — QuestionCorrectAnswer has no deletedAt field. */
  deleteById = async (id: string): Promise<QuestionCorrectAnswer> => {
    return this.prisma.questionCorrectAnswer.delete({ where: { id } });
  };
}
