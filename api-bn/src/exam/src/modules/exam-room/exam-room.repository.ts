import { type PrismaClient } from '#exam/database/index.js';
import {
  type ExamRoom,
  type CreateExamRoomDto,
  type UpdateExamRoomDto,
} from './exam-room.types.js';
import { type IExamRoomRepository } from './exam-room.interface.js';
import { type ExamRoomGetByIdQuery, type ExamRoomGetAllQuery } from './exam-room.query.js';

/**
 * Sentinel value for active (non-deleted) records.
 * The schema uses nullable deletedAt (DateTime?) — null means alive.
 */
const ALIVE: null = null;

/** Handles all ExamRoom database operations via Prisma. Contains no business logic. */
export class ExamRoomRepository implements IExamRoomRepository {
  constructor(private readonly prisma: PrismaClient) {}

  getAll = async (query: ExamRoomGetAllQuery): Promise<ExamRoom[]> => {
    const { page = 1, limit = 10 } = query;
    return (await this.prisma.examRoom.findMany({
      where: {
        deletedAt: ALIVE,
        ...(query.examId !== undefined && { examId: query.examId }),
        ...(query.roomId !== undefined && { roomId: query.roomId }),
      },
      include: {
        room: true,
        examRoomClasses: {
          where: { deletedAt: ALIVE },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })) as unknown as ExamRoom[];
  };

  getById = async (id: string, _query: ExamRoomGetByIdQuery): Promise<ExamRoom | null> => {
    return (await this.prisma.examRoom.findFirst({
      where: { id, deletedAt: ALIVE },
      include: {
        exam: true,
        room: true,
        examRoomClasses: {
          where: { deletedAt: ALIVE },
        },
      },
    })) as unknown as ExamRoom | null;
  };

  create = async (dto: CreateExamRoomDto): Promise<ExamRoom> => {
    const { classIds, ...rest } = dto;
    const created = await this.prisma.examRoom.create({
      data: {
        ...rest,
        ...(classIds && classIds.length > 0
          ? {
              examRoomClasses: {
                createMany: {
                  data: classIds.map((classId) => ({ classId })),
                },
              },
            }
          : {}),
      },
      include: {
        examRoomClasses: {
          where: { deletedAt: ALIVE },
        },
      },
    });
    return created as unknown as ExamRoom;
  };

  private syncClassesAndCleanupParticipants = async (
    examRoomId: string,
    newClassIds: string[],
  ): Promise<void> => {
    const now = new Date();

    // Get current active classes for this exam room
    const currentActiveClasses = await this.prisma.examRoomClass.findMany({
      where: { examRoomId, deletedAt: ALIVE },
      select: { id: true, classId: true },
    });

    const currentClassIds = currentActiveClasses.map((c) => c.classId);
    const removedClassIds = currentClassIds.filter((id) => !newClassIds.includes(id));
    const addedClassIds = newClassIds.filter((id) => !currentClassIds.includes(id));

    // 1. Handle removed classes (Soft Delete ExamRoomClass)
    if (removedClassIds.length > 0) {
      await this.prisma.examRoomClass.updateMany({
        where: {
          examRoomId,
          classId: { in: removedClassIds },
          deletedAt: ALIVE,
        },
        data: { deletedAt: now },
      });

      // Option A Cleanup: Find students in removed classes and soft-delete their ExamParticipant records for this room
      const removedStudents = await this.prisma.shadowClassStudent.findMany({
        where: {
          classId: { in: removedClassIds },
          deletedAt: ALIVE,
        },
        select: { studentId: true },
      });

      const studentIds = [...new Set(removedStudents.map((s) => s.studentId))];
      if (studentIds.length > 0) {
        const shadowStudents = await this.prisma.shadowStudent.findMany({
          where: { id: { in: studentIds }, deletedAt: ALIVE },
          select: { userId: true },
        });

        const userIds = shadowStudents.map((s) => s.userId).filter(Boolean);
        if (userIds.length > 0) {
          await this.prisma.examParticipant.updateMany({
            where: {
              examRoomId,
              userId: { in: userIds },
              deletedAt: ALIVE,
            },
            data: { deletedAt: now },
          });
        }
      }
    }

    // 2. Handle added classes
    for (const classId of addedClassIds) {
      const existing = await this.prisma.examRoomClass.findFirst({
        where: { examRoomId, classId },
      });
      if (existing) {
        await this.prisma.examRoomClass.update({
          where: { id: existing.id },
          data: { deletedAt: null, updatedAt: now },
        });
      } else {
        await this.prisma.examRoomClass.create({
          data: { examRoomId, classId },
        });
      }
    }
  };

  updateById = async (id: string, dto: UpdateExamRoomDto): Promise<ExamRoom> => {
    const { classIds, ...rest } = dto;

    if (classIds !== undefined) {
      await this.syncClassesAndCleanupParticipants(id, classIds);
    }

    const updated = await this.prisma.examRoom.update({
      where: { id },
      data: rest,
      include: {
        examRoomClasses: {
          where: { deletedAt: ALIVE },
        },
      },
    });

    return updated as unknown as ExamRoom;
  };

  deleteById = async (id: string): Promise<ExamRoom> => {
    const now = new Date();

    // Soft delete ExamRoomClass and ExamParticipant associated with this room
    await this.prisma.examRoomClass.updateMany({
      where: { examRoomId: id, deletedAt: ALIVE },
      data: { deletedAt: now },
    });

    await this.prisma.examParticipant.updateMany({
      where: { examRoomId: id, deletedAt: ALIVE },
      data: { deletedAt: now },
    });

    return (await this.prisma.examRoom.update({
      where: { id },
      data: { deletedAt: now },
    })) as unknown as ExamRoom;
  };
}
