import {
  type EssayGrade,
  type CreateEssayGradeDto,
  type UpdateEssayGradeDto,
} from './essay-grade.types.js';
import { type IEssayGradeRepository, type IEssayGradeService } from './essay-grade.interface.js';
import { type EssayGradeGetAllQuery, type EssayGradeGetByIdQuery } from './essay-grade.query.js';
import { NotFoundError } from '#app/errors/index.js';

export class EssayGradeService implements IEssayGradeService {
  constructor(private readonly repository: IEssayGradeRepository) {}

  getAll = async (query: EssayGradeGetAllQuery): Promise<EssayGrade[]> => {
    return this.repository.getAll(query);
  };

  getById = async (id: string, query: EssayGradeGetByIdQuery): Promise<EssayGrade> => {
    const data = await this.repository.getById(id, query);
    if (!data) throw new NotFoundError('Essay grade not found');
    return data;
  };

  upsert = async (dto: CreateEssayGradeDto): Promise<EssayGrade> => {
    const existing = await this.repository.getByRoomUserQuestion(
      dto.examRoomId,
      dto.userId,
      dto.questionId,
    );
    if (existing) {
      return this.repository.updateById(existing.id, { points: dto.points });
    }
    return this.repository.create(dto);
  };

  updateById = async (id: string, dto: UpdateEssayGradeDto): Promise<EssayGrade> => {
    await this.getById(id, {});
    return this.repository.updateById(id, dto);
  };

  deleteById = async (id: string): Promise<EssayGrade> => {
    await this.getById(id, {});
    return this.repository.deleteById(id);
  };
}
