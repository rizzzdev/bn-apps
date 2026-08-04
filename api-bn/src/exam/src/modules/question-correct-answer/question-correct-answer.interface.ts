import {
  type QuestionCorrectAnswer,
  type CreateQuestionCorrectAnswerDto,
  type UpdateQuestionCorrectAnswerDto,
} from "./question-correct-answer.types.js";
import {
  type QuestionCorrectAnswerGetByIdQuery,
  type QuestionCorrectAnswerGetAllQuery,
} from "./question-correct-answer.query.js";
import { type Request, type Response, type NextFunction } from "express";

export interface IQuestionCorrectAnswerRepository {
  getAll(query: QuestionCorrectAnswerGetAllQuery): Promise<QuestionCorrectAnswer[]>;
  getById(
    id: string,
    query: QuestionCorrectAnswerGetByIdQuery,
  ): Promise<QuestionCorrectAnswer | null>;
  getByQuestionId(questionId: string): Promise<QuestionCorrectAnswer | null>;
  create(dto: CreateQuestionCorrectAnswerDto): Promise<QuestionCorrectAnswer>;
  updateById(id: string, dto: UpdateQuestionCorrectAnswerDto): Promise<QuestionCorrectAnswer>;
  deleteById(id: string): Promise<QuestionCorrectAnswer>;
}

export interface IQuestionCorrectAnswerService {
  getAll(query: QuestionCorrectAnswerGetAllQuery): Promise<QuestionCorrectAnswer[]>;
  getById(id: string, query: QuestionCorrectAnswerGetByIdQuery): Promise<QuestionCorrectAnswer>;
  create(dto: CreateQuestionCorrectAnswerDto): Promise<QuestionCorrectAnswer>;
  updateById(id: string, dto: UpdateQuestionCorrectAnswerDto): Promise<QuestionCorrectAnswer>;
  deleteById(id: string): Promise<QuestionCorrectAnswer>;
}

export interface IQuestionCorrectAnswerController {
  getAll(request: Request, response: Response, next: NextFunction): void;
  getById(request: Request, response: Response, next: NextFunction): void;
  create(request: Request, response: Response, next: NextFunction): void;
  updateById(request: Request, response: Response, next: NextFunction): void;
  deleteById(request: Request, response: Response, next: NextFunction): void;
}
