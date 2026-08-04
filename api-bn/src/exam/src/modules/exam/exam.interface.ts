import { type Exam, type CreateExamDto, type UpdateExamDto } from './exam.types.js';
import { type ExamGetByIdQuery, type ExamGetAllQuery } from './exam.query.js';
import { type Request, type Response, type NextFunction } from 'express';

export interface IExamRepository {
  getAll(query: ExamGetAllQuery): Promise<Exam[]>;
  getById(id: string, query: ExamGetByIdQuery): Promise<Exam | null>;
  create(dto: CreateExamDto): Promise<Exam>;
  updateById(id: string, dto: UpdateExamDto): Promise<Exam>;
  deleteById(id: string): Promise<Exam>;
}

export interface IExamService {
  getAll(query: ExamGetAllQuery): Promise<Exam[]>;
  getById(id: string, query: ExamGetByIdQuery): Promise<Exam>;
  create(dto: CreateExamDto): Promise<Exam>;
  updateById(id: string, dto: UpdateExamDto): Promise<Exam>;
  deleteById(id: string): Promise<Exam>;
}

export interface IExamController {
  getAll(request: Request, response: Response, next: NextFunction): void;
  getById(request: Request, response: Response, next: NextFunction): void;
  create(request: Request, response: Response, next: NextFunction): void;
  updateById(request: Request, response: Response, next: NextFunction): void;
  deleteById(request: Request, response: Response, next: NextFunction): void;
}
