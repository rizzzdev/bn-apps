import {
  type ExamScore,
  type CreateExamScoreDto,
  type UpdateExamScoreDto,
} from "./exam-score.types.js";
import { type IExamScoreRepository, type IExamScoreService } from "./exam-score.interface.js";
import { type ExamScoreGetByIdQuery, type ExamScoreGetAllQuery } from "./exam-score.query.js";
import { NotFoundError, BadRequestError } from "#app/errors/index.js";

/** Handles ExamScore business logic. Depends on IExamScoreRepository. */
export class ExamScoreService implements IExamScoreService {
  constructor(private readonly repository: IExamScoreRepository) {}

  getAll = async (query: ExamScoreGetAllQuery): Promise<ExamScore[]> => {
    return this.repository.getAll(query);
  };

  getById = async (id: string, query: ExamScoreGetByIdQuery): Promise<ExamScore> => {
    const data = await this.repository.getById(id, query);
    if (!data) {
      throw new NotFoundError("Exam score not found");
    }
    return data;
  };

  private assertUniqueScore = async (
    examRoomId: string,
    userId: string,
    excludeId?: string,
  ): Promise<void> => {
    const existing = await this.repository.getByRoomAndUser(examRoomId, userId);
    if (existing && existing.id !== excludeId) {
      throw new BadRequestError("Score already exists for this user in this exam room");
    }
  };

  create = async (dto: CreateExamScoreDto): Promise<ExamScore> => {
    await this.assertUniqueScore(dto.examRoomId, dto.userId);
    return this.repository.create(dto);
  };

  updateById = async (id: string, dto: UpdateExamScoreDto): Promise<ExamScore> => {
    const existing = await this.getById(id, {});
    if (Object.keys(dto).length === 0) {
      return existing;
    }
    if (dto.examRoomId !== undefined || dto.userId !== undefined) {
      const examRoomId = dto.examRoomId ?? existing.examRoomId;
      const userId = dto.userId ?? existing.userId;
      await this.assertUniqueScore(examRoomId, userId, id);
    }
    return this.repository.updateById(id, dto);
  };

  deleteById = async (id: string): Promise<ExamScore> => {
    await this.getById(id, {});
    return this.repository.deleteById(id);
  };
}
