import {
  type ExamRoom,
  type CreateExamRoomDto,
  type UpdateExamRoomDto,
} from './exam-room.types.js';
import { type ExamRoomGetByIdQuery, type ExamRoomGetAllQuery } from './exam-room.query.js';
import { type Request, type Response, type NextFunction } from 'express';

export interface IExamRoomRepository {
  getAll(query: ExamRoomGetAllQuery): Promise<ExamRoom[]>;
  getById(id: string, query: ExamRoomGetByIdQuery): Promise<ExamRoom | null>;
  create(dto: CreateExamRoomDto): Promise<ExamRoom>;
  updateById(id: string, dto: UpdateExamRoomDto): Promise<ExamRoom>;
  deleteById(id: string): Promise<ExamRoom>;
}

export interface IExamRoomService {
  getAll(query: ExamRoomGetAllQuery): Promise<ExamRoom[]>;
  getById(id: string, query: ExamRoomGetByIdQuery): Promise<ExamRoom>;
  create(dto: CreateExamRoomDto): Promise<ExamRoom>;
  updateById(id: string, dto: UpdateExamRoomDto): Promise<ExamRoom>;
  deleteById(id: string): Promise<ExamRoom>;
}

export interface IExamRoomController {
  getAll(request: Request, response: Response, next: NextFunction): void;
  getById(request: Request, response: Response, next: NextFunction): void;
  create(request: Request, response: Response, next: NextFunction): void;
  updateById(request: Request, response: Response, next: NextFunction): void;
  deleteById(request: Request, response: Response, next: NextFunction): void;
  getParticipantsStatus(request: Request, response: Response, next: NextFunction): void;
}
