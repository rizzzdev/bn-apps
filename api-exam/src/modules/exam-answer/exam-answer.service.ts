import {
  type ExamAnswer,
  type CreateExamAnswerDto,
  type UpdateExamAnswerDto,
} from "./exam-answer.types.js";
import { type IExamAnswerRepository, type IExamAnswerService } from "./exam-answer.interface.js";
import { type ExamAnswerGetByIdQuery, type ExamAnswerGetAllQuery } from "./exam-answer.query.js";
import { NotFoundError, BadRequestError } from "../../utils/errors.js";
import { getIO } from "../../socket/socket-manager.js";
import { redisKeys } from "../../socket/socket-keys.js";
import { redisClient } from "../../configs/redis.config.js";

const answerBatch = new Map<string, ExamAnswer[]>();
let batchTimer: NodeJS.Timeout | null = null;

/** Handles ExamAnswer business logic. Depends on IExamAnswerRepository. */
export class ExamAnswerService implements IExamAnswerService {
  constructor(private readonly repository: IExamAnswerRepository) {}

  getAll = async (query: ExamAnswerGetAllQuery): Promise<ExamAnswer[]> => {
    let cacheKey: string | null = null;
    if (query.examRoomId && query.userId) {
      cacheKey = `exam_answers:${query.examRoomId}:${query.userId}`;
      const cached = await redisClient.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }

    const data = await this.repository.getAll(query);

    if (cacheKey) {
      await redisClient.set(cacheKey, JSON.stringify(data), { EX: 3600 });
    }
    return data;
  };

  private async invalidateCache(examRoomId: string, userId: string): Promise<void> {
    await redisClient.del(`exam_answers:${examRoomId}:${userId}`);
  }

  getById = async (id: string, query: ExamAnswerGetByIdQuery): Promise<ExamAnswer> => {
    const data = await this.repository.getById(id, query);
    if (!data) {
      throw new NotFoundError("Exam answer not found");
    }
    return data;
  };

  private assertUniqueAnswer = async (
    examRoomId: string,
    userId: string,
    questionId: string,
    excludeId?: string,
  ): Promise<void> => {
    const existing = await this.repository.getByRoomUserQuestion(examRoomId, userId, questionId);
    if (existing && existing.id !== excludeId) {
      throw new BadRequestError(
        "Answer already exists for this user and question in this exam room",
      );
    }
  };

  private broadcastAnswer = (answer: ExamAnswer) => {
    if (!answerBatch.has(answer.examRoomId)) {
      answerBatch.set(answer.examRoomId, []);
    }
    answerBatch.get(answer.examRoomId)!.push(answer);

    if (!batchTimer) {
      batchTimer = setTimeout(() => {
        const io = getIO();
        if (io) {
          for (const [examRoomId, answers] of answerBatch.entries()) {
            for (const a of answers) {
              io.to(redisKeys.supervisorRoom(examRoomId)).emit("exam:participant:answer_updated", {
                userId: a.userId,
                questionId: a.questionId,
                answerId: a.id,
                optionId: a.optionId,
                text: a.text,
              });
            }
          }
        }
        answerBatch.clear();
        batchTimer = null;
      }, 3000);
    }
  };

  create = async (dto: CreateExamAnswerDto): Promise<ExamAnswer> => {
    await this.assertUniqueAnswer(dto.examRoomId, dto.userId, dto.questionId);
    const data = await this.repository.create(dto);
    this.broadcastAnswer(data);
    await this.invalidateCache(dto.examRoomId, dto.userId);
    return data;
  };

  updateById = async (id: string, dto: UpdateExamAnswerDto): Promise<ExamAnswer> => {
    const existing = await this.getById(id, {});
    if (Object.keys(dto).length === 0) {
      return existing;
    }
    const examRoomId = dto.examRoomId ?? existing.examRoomId;
    const userId = dto.userId ?? existing.userId;
    const questionId = dto.questionId ?? existing.questionId;
    if (dto.examRoomId !== undefined || dto.userId !== undefined || dto.questionId !== undefined) {
      await this.assertUniqueAnswer(examRoomId, userId, questionId, id);
    }
    const data = await this.repository.updateById(id, dto);
    this.broadcastAnswer(data);
    await this.invalidateCache(data.examRoomId, data.userId);
    return data;
  };

  deleteById = async (id: string): Promise<ExamAnswer> => {
    const existing = await this.getById(id, {});
    const data = await this.repository.deleteById(id);
    await this.invalidateCache(existing.examRoomId, existing.userId);
    return data;
  };
}
