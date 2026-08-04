import { type PrismaClient } from '#exam/database/index.js';
import {
  type ExamSupervisor,
  type CreateExamSupervisorDto,
  type UpdateExamSupervisorDto,
} from './exam-supervisor.types.js';
import { type IExamSupervisorRepository } from './exam-supervisor.interface.js';
import {
  type ExamSupervisorGetByIdQuery,
  type ExamSupervisorGetAllQuery,
} from './exam-supervisor.query.js';

/** Handles all ExamSupervisor database operations via Prisma. Contains no business logic. */
export class ExamSupervisorRepository implements IExamSupervisorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  getAll = async (query: ExamSupervisorGetAllQuery): Promise<ExamSupervisor[]> => {
    const { page = 1, limit = 10 } = query;
    return this.prisma.examSupervisor.findMany({
      where: {
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
    _query: ExamSupervisorGetByIdQuery,
  ): Promise<ExamSupervisor | null> => {
    return this.prisma.examSupervisor.findFirst({ where: { id } });
  };

  getByExamRoomAndUser = async (
    examRoomId: string,
    userId: string,
  ): Promise<ExamSupervisor | null> => {
    return this.prisma.examSupervisor.findFirst({ where: { examRoomId, userId } });
  };

  findScheduleConflictExamName = async (
    userId: string,
    examRoomId: string,
    excludeId?: string,
  ): Promise<string | null> => {
    const examRoom = await this.prisma.examRoom.findFirst({
      where: { id: examRoomId, deletedAt: null },
      include: { exam: true },
    });
    if (!examRoom) return null;

    const { startTime, endTime } = examRoom.exam;

    const conflict = await this.prisma.examSupervisor.findFirst({
      where: {
        userId,
        examRoomId: { not: examRoomId },
        ...(excludeId && { id: { not: excludeId } }),
        examRoom: {
          deletedAt: null,
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
      where: { id: examRoomId, deletedAt: null },
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

  create = async (dto: CreateExamSupervisorDto): Promise<ExamSupervisor> => {
    return this.prisma.examSupervisor.create({ data: dto });
  };

  updateById = async (id: string, dto: UpdateExamSupervisorDto): Promise<ExamSupervisor> => {
    return this.prisma.examSupervisor.update({ where: { id }, data: dto });
  };

  /** Hard delete — ExamSupervisor has no deletedAt field. */
  deleteById = async (id: string): Promise<ExamSupervisor> => {
    return this.prisma.examSupervisor.delete({ where: { id } });
  };
}
