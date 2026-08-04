import {
  type ExamQuestion,
  type CreateExamQuestionDto,
  type UpdateExamQuestionDto,
} from "./exam-question.types.js";
import {
  type IExamQuestionRepository,
  type IExamQuestionService,
} from "./exam-question.interface.js";
import {
  type ExamQuestionGetByIdQuery,
  type ExamQuestionGetAllQuery,
} from "./exam-question.query.js";
import { NotFoundError, BadRequestError } from "#app/errors/index.js";
import { redisClient } from "#exam/configs/redis.config.js";

/** Handles ExamQuestion business logic. Depends on IExamQuestionRepository. */
export class ExamQuestionService implements IExamQuestionService {
  constructor(private readonly repository: IExamQuestionRepository) {}

  getAll = async (query: ExamQuestionGetAllQuery): Promise<ExamQuestion[]> => {
    // Only cache if querying by examRoomId (typical participant fetching scenario)
    if (query.examRoomId && Object.keys(query).length <= 2) {
      const cacheKey = `exam_questions:${query.examRoomId}`;
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached) as ExamQuestion[];
        } catch {
          // ignore parse error
        }
      }
      const data = await this.repository.getAll(query);
      await redisClient.set(cacheKey, JSON.stringify(data), { EX: 7200 }); // 2 hours
      return data;
    }
    return this.repository.getAll(query);
  };

  getById = async (id: string, query: ExamQuestionGetByIdQuery): Promise<ExamQuestion> => {
    const data = await this.repository.getById(id, query);
    if (!data) {
      throw new NotFoundError("Exam question not found");
    }
    return data;
  };

  private assertUniqueRoomQuestion = async (
    examRoomId: string,
    questionId: string,
    excludeId?: string,
  ): Promise<void> => {
    const existing = await this.repository.getByRoomAndQuestion(examRoomId, questionId);
    if (existing && existing.id !== excludeId) {
      throw new BadRequestError("Question is already assigned to this exam room");
    }
  };

  private assertUniqueRoomNumber = async (
    examRoomId: string,
    questionNumber: number,
    excludeId?: string,
  ): Promise<void> => {
    const existing = await this.repository.getByRoomAndNumber(examRoomId, questionNumber);
    if (existing && existing.id !== excludeId) {
      throw new BadRequestError("Question number is already used in this exam room");
    }
  };

  private invalidateCache = async (examRoomId: string): Promise<void> => {
    await redisClient.del(`exam_questions:${examRoomId}`);
  };

  create = async (dto: CreateExamQuestionDto): Promise<ExamQuestion> => {
    await this.assertUniqueRoomQuestion(dto.examRoomId, dto.questionId);
    await this.assertUniqueRoomNumber(dto.examRoomId, dto.questionNumber);
    const data = await this.repository.create(dto);
    await this.invalidateCache(dto.examRoomId);
    return data;
  };

  updateById = async (id: string, dto: UpdateExamQuestionDto): Promise<ExamQuestion> => {
    const existing = await this.getById(id, {});
    if (Object.keys(dto).length === 0) {
      return existing;
    }
    const examRoomId = dto.examRoomId ?? existing.examRoomId;
    const questionId = dto.questionId ?? existing.questionId;
    const questionNumber = dto.questionNumber ?? existing.questionNumber;
    if (dto.questionId !== undefined || dto.examRoomId !== undefined) {
      await this.assertUniqueRoomQuestion(examRoomId, questionId, id);
    }
    if (dto.questionNumber !== undefined || dto.examRoomId !== undefined) {
      await this.assertUniqueRoomNumber(examRoomId, questionNumber, id);
    }
    const data = await this.repository.updateById(id, dto);
    await this.invalidateCache(data.examRoomId);
    return data;
  };

  deleteById = async (id: string): Promise<ExamQuestion> => {
    const existing = await this.getById(id, {});
    const data = await this.repository.deleteById(id);
    await this.invalidateCache(existing.examRoomId);
    return data;
  };
}
