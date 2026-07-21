import {
  type ExamSupervisor,
  type CreateExamSupervisorDto,
  type UpdateExamSupervisorDto,
} from "./exam-supervisor.types.js";
import {
  type ExamSupervisorGetByIdQuery,
  type ExamSupervisorGetAllQuery,
} from "./exam-supervisor.query.js";
import { type Request, type Response, type NextFunction } from "express";

export interface IExamSupervisorRepository {
  getAll(query: ExamSupervisorGetAllQuery): Promise<ExamSupervisor[]>;
  getById(id: string, query: ExamSupervisorGetByIdQuery): Promise<ExamSupervisor | null>;
  getByExamRoomAndUser(examRoomId: string, userId: string): Promise<ExamSupervisor | null>;
  /**
   * Returns the name of another exam the user is already supervising, whose
   * schedule overlaps the given exam room's exam — or null if there's no conflict.
   */
  findScheduleConflictExamName(
    userId: string,
    examRoomId: string,
    excludeId?: string,
  ): Promise<string | null>;
  /** Exam + room name and schedule for an exam room, used to compose notification text. */
  getExamRoomScheduleInfo(
    examRoomId: string,
  ): Promise<{ examName: string; roomName: string; startTime: Date; endTime: Date } | null>;
  create(dto: CreateExamSupervisorDto): Promise<ExamSupervisor>;
  updateById(id: string, dto: UpdateExamSupervisorDto): Promise<ExamSupervisor>;
  deleteById(id: string): Promise<ExamSupervisor>;
}

export interface IExamSupervisorService {
  getAll(query: ExamSupervisorGetAllQuery): Promise<ExamSupervisor[]>;
  getById(id: string, query: ExamSupervisorGetByIdQuery): Promise<ExamSupervisor>;
  create(dto: CreateExamSupervisorDto): Promise<ExamSupervisor>;
  updateById(id: string, dto: UpdateExamSupervisorDto): Promise<ExamSupervisor>;
  deleteById(id: string): Promise<ExamSupervisor>;
}

export interface IExamSupervisorController {
  getAll(request: Request, response: Response, next: NextFunction): void;
  getById(request: Request, response: Response, next: NextFunction): void;
  create(request: Request, response: Response, next: NextFunction): void;
  updateById(request: Request, response: Response, next: NextFunction): void;
  deleteById(request: Request, response: Response, next: NextFunction): void;
}
