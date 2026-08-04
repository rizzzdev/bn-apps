import { type Question, type CreateQuestionDto, type UpdateQuestionDto } from "./question.types.js";
import { type QuestionGetByIdQuery, type QuestionGetAllQuery } from "./question.query.js";
import { type Request, type Response, type NextFunction } from "express";

export interface IQuestionRepository {
  getAll(query: QuestionGetAllQuery): Promise<Question[]>;
  getById(id: string, query: QuestionGetByIdQuery): Promise<Question | null>;
  create(dto: CreateQuestionDto): Promise<Question>;
  updateById(id: string, dto: UpdateQuestionDto): Promise<Question>;
  deleteById(id: string): Promise<Question>;
}

export interface IQuestionService {
  getAll(query: QuestionGetAllQuery): Promise<Question[]>;
  getById(id: string, query: QuestionGetByIdQuery): Promise<Question>;
  create(dto: CreateQuestionDto): Promise<Question>;
  updateById(id: string, dto: UpdateQuestionDto): Promise<Question>;
  deleteById(id: string): Promise<Question>;
}

export interface IQuestionController {
  getAll(request: Request, response: Response, next: NextFunction): void;
  getById(request: Request, response: Response, next: NextFunction): void;
  create(request: Request, response: Response, next: NextFunction): void;
  updateById(request: Request, response: Response, next: NextFunction): void;
  deleteById(request: Request, response: Response, next: NextFunction): void;
}
