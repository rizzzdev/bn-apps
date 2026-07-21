import {
  type ExamScore,
  type CreateExamScoreDto,
  type UpdateExamScoreDto,
} from "./exam-score.types.js";
import { type ExamScoreGetByIdQuery, type ExamScoreGetAllQuery } from "./exam-score.query.js";
import { type Request, type Response, type NextFunction } from "express";

export interface IExamScoreRepository {
  getAll(query: ExamScoreGetAllQuery): Promise<ExamScore[]>;
  getById(id: string, query: ExamScoreGetByIdQuery): Promise<ExamScore | null>;
  getByRoomAndUser(examRoomId: string, userId: string): Promise<ExamScore | null>;
  create(dto: CreateExamScoreDto): Promise<ExamScore>;
  updateById(id: string, dto: UpdateExamScoreDto): Promise<ExamScore>;
  deleteById(id: string): Promise<ExamScore>;
}

export interface IExamScoreService {
  getAll(query: ExamScoreGetAllQuery): Promise<ExamScore[]>;
  getById(id: string, query: ExamScoreGetByIdQuery): Promise<ExamScore>;
  create(dto: CreateExamScoreDto): Promise<ExamScore>;
  updateById(id: string, dto: UpdateExamScoreDto): Promise<ExamScore>;
  deleteById(id: string): Promise<ExamScore>;
}

export interface IExamScoreController {
  getAll(request: Request, response: Response, next: NextFunction): void;
  getById(request: Request, response: Response, next: NextFunction): void;
  create(request: Request, response: Response, next: NextFunction): void;
  updateById(request: Request, response: Response, next: NextFunction): void;
  deleteById(request: Request, response: Response, next: NextFunction): void;
}
