import { type PrismaClient } from '#exam/database/index.js';
import {
  type ExamParticipant,
  type CreateExamParticipantDto,
  type UpdateExamParticipantDto,
} from './exam-participant.types.js';
import { type IExamParticipantRepository } from './exam-participant.interface.js';
import {
  type ExamParticipantGetByIdQuery,
  type ExamParticipantGetAllQuery,
} from './exam-participant.query.js';

const ALIVE: null = null;

/** Handles all ExamParticipant database operations via Prisma. Contains no business logic. */
export class ExamParticipantRepository implements IExamParticipantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  getAll = async (query: ExamParticipantGetAllQuery): Promise<ExamParticipant[]> => {
    const { page = 1, limit = 10 } = query;
    return this.prisma.examParticipant.findMany({
      where: {
        deletedAt: ALIVE,
        ...(query.examRoomId !== undefined && { examRoomId: query.examRoomId }),
        ...(query.userId !== undefined && { userId: query.userId }),
      },
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  };

  getById = async (
    id: string,
    _query: ExamParticipantGetByIdQuery,
  ): Promise<ExamParticipant | null> => {
    return this.prisma.examParticipant.findFirst({ where: { id, deletedAt: ALIVE } });
  };

  getByExamRoomAndUser = async (
    examRoomId: string,
    userId: string,
  ): Promise<ExamParticipant | null> => {
    return this.prisma.examParticipant.findFirst({ where: { examRoomId, userId, deletedAt: ALIVE } });
  };

  findScheduleConflictExamName = async (
    userId: string,
    examRoomId: string,
    excludeId?: string,
  ): Promise<string | null> => {
    const examRoom = await this.prisma.examRoom.findFirst({
      where: { id: examRoomId, deletedAt: ALIVE },
      include: { exam: true },
    });
    if (!examRoom) return null;

    const { startTime, endTime } = examRoom.exam;

    const conflict = await this.prisma.examParticipant.findFirst({
      where: {
        userId,
        deletedAt: ALIVE,
        examRoomId: { not: examRoomId },
        ...(excludeId && { id: { not: excludeId } }),
        examRoom: {
          deletedAt: ALIVE,
          exam: {
            startTime: { lte: endTime },
            endTime: { gte: startTime },
          },
        },
      },
      include: { examRoom: { include: { exam: true } } },
    });

    return conflict?.examRoom.exam.name ?? null;
  };

  getExamRoomScheduleInfo = async (
    examRoomId: string,
  ): Promise<{ examName: string; roomName: string; startTime: Date; endTime: Date } | null> => {
    const examRoom = await this.prisma.examRoom.findFirst({
      where: { id: examRoomId, deletedAt: ALIVE },
      include: { exam: true, room: true },
    });
    if (!examRoom) return null;

    return {
      examName: examRoom.exam.name,
      roomName: examRoom.room.name,
      startTime: examRoom.exam.startTime,
      endTime: examRoom.exam.endTime,
    };
  };

  getRoomCapacityStatus = async (
    examRoomId: string,
  ): Promise<{ capacity: number; occupied: number } | null> => {
    const examRoom = await this.prisma.examRoom.findFirst({
      where: { id: examRoomId, deletedAt: ALIVE },
      include: { room: true, exam: true },
    });
    if (!examRoom) return null;
    if (examRoom.room.capacity === null) return null;

    const overlappingExamRooms = await this.prisma.examRoom.findMany({
      where: {
        roomId: examRoom.roomId,
        deletedAt: ALIVE,
        exam: {
          startTime: { lte: examRoom.exam.endTime },
          endTime: { gte: examRoom.exam.startTime },
        },
      },
      select: { id: true },
    });

    const occupied = await this.prisma.examParticipant.count({
      where: { examRoomId: { in: overlappingExamRooms.map((er) => er.id) }, deletedAt: ALIVE },
    });

    return { capacity: examRoom.room.capacity, occupied };
  };

  create = async (dto: CreateExamParticipantDto): Promise<ExamParticipant> => {
    // If a soft deleted record exists for this examRoomId and userId, restore it
    const existing = await this.prisma.examParticipant.findFirst({
      where: { examRoomId: dto.examRoomId, userId: dto.userId },
    });

    if (existing) {
      return this.prisma.examParticipant.update({
        where: { id: existing.id },
        data: { status: dto.status ?? 'NOT_SUBMITTED', deletedAt: null, updatedAt: new Date() },
      });
    }

    return this.prisma.examParticipant.create({ data: dto });
  };

  updateById = async (id: string, dto: UpdateExamParticipantDto): Promise<ExamParticipant> => {
    return this.prisma.examParticipant.update({ where: { id }, data: dto });
  };

  /** Soft delete. */
  deleteById = async (id: string): Promise<ExamParticipant> => {
    return this.prisma.examParticipant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  };
}
