import {
  type EssayGrade,
  type CreateEssayGradeDto,
  type UpdateEssayGradeDto,
} from './essay-grade.types.js';
import { type EssayGradeGetAllQuery, type EssayGradeGetByIdQuery } from './essay-grade.query.js';

export interface IEssayGradeRepository {
  getAll(query: EssayGradeGetAllQuery): Promise<EssayGrade[]>;
  getById(id: string, query: EssayGradeGetByIdQuery): Promise<EssayGrade | null>;
  getByRoomUserQuestion(
    examRoomId: string,
    userId: string,
    questionId: string,
  ): Promise<EssayGrade | null>;
  create(dto: CreateEssayGradeDto): Promise<EssayGrade>;
  updateById(id: string, dto: UpdateEssayGradeDto): Promise<EssayGrade>;
  deleteById(id: string): Promise<EssayGrade>;
}

export interface IEssayGradeService {
  getAll(query: EssayGradeGetAllQuery): Promise<EssayGrade[]>;
  getById(id: string, query: EssayGradeGetByIdQuery): Promise<EssayGrade>;
  upsert(dto: CreateEssayGradeDto): Promise<EssayGrade>;
  updateById(id: string, dto: UpdateEssayGradeDto): Promise<EssayGrade>;
  deleteById(id: string): Promise<EssayGrade>;
}
