import {
  type ExamAnswer,
  type CreateExamAnswerDto,
  type UpdateExamAnswerDto,
} from "./exam-answer.types.js";
import { type ExamAnswerGetByIdQuery, type ExamAnswerGetAllQuery } from "./exam-answer.query.js";
import { type Request, type Response, type NextFunction } from "express";

export interface IExamAnswerRepository {
  getAll(query: ExamAnswerGetAllQuery): Promise<ExamAnswer[]>;
  getById(id: string, query: ExamAnswerGetByIdQuery): Promise<ExamAnswer | null>;
  getByRoomUserQuestion(
    examRoomId: string,
    userId: string,
    questionId: string,
  ): Promise<ExamAnswer | null>;
  create(dto: CreateExamAnswerDto): Promise<ExamAnswer>;
  updateById(id: string, dto: UpdateExamAnswerDto): Promise<ExamAnswer>;
  deleteById(id: string): Promise<ExamAnswer>;
}

export interface IExamAnswerService {
  getAll(query: ExamAnswerGetAllQuery): Promise<ExamAnswer[]>;
  getById(id: string, query: ExamAnswerGetByIdQuery): Promise<ExamAnswer>;
  create(dto: CreateExamAnswerDto): Promise<ExamAnswer>;
  updateById(id: string, dto: UpdateExamAnswerDto): Promise<ExamAnswer>;
  deleteById(id: string): Promise<ExamAnswer>;
}

export interface IExamAnswerController {
  getAll(request: Request, response: Response, next: NextFunction): void;
  getById(request: Request, response: Response, next: NextFunction): void;
  create(request: Request, response: Response, next: NextFunction): void;
  updateById(request: Request, response: Response, next: NextFunction): void;
  deleteById(request: Request, response: Response, next: NextFunction): void;
}
