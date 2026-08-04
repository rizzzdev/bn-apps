import {
  type ExamQuestion,
  type CreateExamQuestionDto,
  type UpdateExamQuestionDto,
} from "./exam-question.types.js";
import {
  type ExamQuestionGetByIdQuery,
  type ExamQuestionGetAllQuery,
} from "./exam-question.query.js";
import { type Request, type Response, type NextFunction } from "express";

export interface IExamQuestionRepository {
  getAll(query: ExamQuestionGetAllQuery): Promise<ExamQuestion[]>;
  getById(id: string, query: ExamQuestionGetByIdQuery): Promise<ExamQuestion | null>;
  getByRoomAndQuestion(examRoomId: string, questionId: string): Promise<ExamQuestion | null>;
  getByRoomAndNumber(examRoomId: string, questionNumber: number): Promise<ExamQuestion | null>;
  create(dto: CreateExamQuestionDto): Promise<ExamQuestion>;
  updateById(id: string, dto: UpdateExamQuestionDto): Promise<ExamQuestion>;
  deleteById(id: string): Promise<ExamQuestion>;
}

export interface IExamQuestionService {
  getAll(query: ExamQuestionGetAllQuery): Promise<ExamQuestion[]>;
  getById(id: string, query: ExamQuestionGetByIdQuery): Promise<ExamQuestion>;
  create(dto: CreateExamQuestionDto): Promise<ExamQuestion>;
  updateById(id: string, dto: UpdateExamQuestionDto): Promise<ExamQuestion>;
  deleteById(id: string): Promise<ExamQuestion>;
}

export interface IExamQuestionController {
  getAll(request: Request, response: Response, next: NextFunction): void;
  getById(request: Request, response: Response, next: NextFunction): void;
  create(request: Request, response: Response, next: NextFunction): void;
  updateById(request: Request, response: Response, next: NextFunction): void;
  deleteById(request: Request, response: Response, next: NextFunction): void;
}
