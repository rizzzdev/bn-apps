import {
  type ExamParticipant,
  type CreateExamParticipantDto,
  type UpdateExamParticipantDto,
} from './exam-participant.types.js';
import {
  type ExamParticipantGetByIdQuery,
  type ExamParticipantGetAllQuery,
} from './exam-participant.query.js';
import { type Request, type Response, type NextFunction } from 'express';

export interface IExamParticipantRepository {
  getAll(query: ExamParticipantGetAllQuery): Promise<ExamParticipant[]>;
  getById(id: string, query: ExamParticipantGetByIdQuery): Promise<ExamParticipant | null>;
  getByExamRoomAndUser(examRoomId: string, userId: string): Promise<ExamParticipant | null>;
  /**
   * Returns the name of another exam the user is already a participant of, whose
   * schedule overlaps the given exam room's exam — or null if there's no conflict.
   */
  findScheduleConflictExamName(
    userId: string,
    examRoomId: string,
    excludeId?: string,
  ): Promise<string | null>;
  /**
   * Room capacity vs. how many participants already occupy that room across all
   * exams overlapping the given exam room's schedule. Null if the room has no
   * capacity limit or the exam room doesn't exist.
   */
  getRoomCapacityStatus(examRoomId: string): Promise<{ capacity: number; occupied: number } | null>;
  /** Exam + room name and schedule for an exam room, used to compose notification text. */
  getExamRoomScheduleInfo(
    examRoomId: string,
  ): Promise<{ examName: string; roomName: string; startTime: Date; endTime: Date } | null>;
  create(dto: CreateExamParticipantDto): Promise<ExamParticipant>;
  updateById(id: string, dto: UpdateExamParticipantDto): Promise<ExamParticipant>;
  deleteById(id: string): Promise<ExamParticipant>;
}

export interface IExamParticipantService {
  getAll(query: ExamParticipantGetAllQuery): Promise<ExamParticipant[]>;
  getById(id: string, query: ExamParticipantGetByIdQuery): Promise<ExamParticipant>;
  create(dto: CreateExamParticipantDto): Promise<ExamParticipant>;
  updateById(id: string, dto: UpdateExamParticipantDto): Promise<ExamParticipant>;
  deleteById(id: string): Promise<ExamParticipant>;
}

export interface IExamParticipantController {
  getAll(request: Request, response: Response, next: NextFunction): void;
  getById(request: Request, response: Response, next: NextFunction): void;
  create(request: Request, response: Response, next: NextFunction): void;
  updateById(request: Request, response: Response, next: NextFunction): void;
  deleteById(request: Request, response: Response, next: NextFunction): void;
}
