import {
  type ExamRoom,
  type CreateExamRoomDto,
  type UpdateExamRoomDto,
} from "./exam-room.types.js";
import { type IExamRoomRepository, type IExamRoomService } from "./exam-room.interface.js";
import { type ExamRoomGetByIdQuery, type ExamRoomGetAllQuery } from "./exam-room.query.js";
import { NotFoundError, BadRequestError } from "../../utils/errors.js";
import { prisma } from "../../app/database/index.js";

import { redisClient } from "../../configs/redis.config.js";

/** Handles ExamRoom business logic. Depends on IExamRoomRepository. */
export class ExamRoomService implements IExamRoomService {
  constructor(private readonly repository: IExamRoomRepository) {}

  getAll = async (query: ExamRoomGetAllQuery): Promise<ExamRoom[]> => {
    return this.repository.getAll(query);
  };

  getById = async (id: string, query: ExamRoomGetByIdQuery): Promise<ExamRoom> => {
    const cacheKey = `exam_room:${id}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached) as ExamRoom;
      } catch {}
    }

    const data = await this.repository.getById(id, query);
    if (!data) {
      throw new NotFoundError("Exam room not found");
    }
    
    await redisClient.set(cacheKey, JSON.stringify(data), { EX: 7200 }); // Cache for 2 hours
    return data;
  };

  create = async (dto: CreateExamRoomDto): Promise<ExamRoom> => {
    const existing = await this.repository.getAll({
      examId: dto.examId,
      roomId: dto.roomId,
    });
    if (existing && existing.some((r) => r.deletedAt === null)) {
      throw new BadRequestError("Ruangan sudah ditambahkan ke ujian ini");
    }

    const result = await this.repository.create(dto);
    
    import("../../app/database/index.js").then(({ prisma }) => {
      prisma.exam.findUnique({ where: { id: result.examId } }).then((exam) => {
        if (exam) {
          import("../../socket/exam-queue.js").then(({ scheduleExamRoom }) => {
            void scheduleExamRoom(result.id, exam.startTime, exam.endTime);
          });
        }
      });
    }).catch(() => {});

    return result;
  };

  private assertCapacityNotExceeded = async (
    roomId: string,
    examId: string,
    additionalCount: number,
  ): Promise<void> => {
    if (additionalCount <= 0) return;

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) return;
    if (room.capacity === null) return;

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) return;

    const overlappingExamRooms = await prisma.examRoom.findMany({
      where: {
        roomId,
        exam: {
          startTime: { lte: exam.endTime },
          endTime: { gte: exam.startTime },
        },
      },
      select: { id: true },
    });

    const overlappingIds = overlappingExamRooms.map((er) => er.id);

    const totalParticipants = await prisma.examParticipant.count({
      where: {
        examRoomId: { in: overlappingIds },
      },
    });

    if (totalParticipants + additionalCount > room.capacity) {
      throw new BadRequestError(
        `Kapasitas ruangan penuh pada rentang waktu ini (Sisa kursi: ${Math.max(0, room.capacity - totalParticipants)})`,
      );
    }
  };

  updateById = async (id: string, dto: UpdateExamRoomDto): Promise<ExamRoom> => {
    const existing = await this.getById(id, {});
    if (Object.keys(dto).length === 0) {
      return existing;
    }

    if (dto.roomId && dto.roomId !== existing.roomId) {
      // Find how many participants are currently in this exam room
      const currentParticipantsCount = await prisma.examParticipant.count({
        where: { examRoomId: id },
      });

      await this.assertCapacityNotExceeded(dto.roomId, existing.examId, currentParticipantsCount);
    }

    const data = await this.repository.updateById(id, dto);
    await redisClient.del(`exam_room:${id}`);
    return data;
  };

  deleteById = async (id: string): Promise<ExamRoom> => {
    await this.getById(id, {});
    const data = await this.repository.deleteById(id);
    await redisClient.del(`exam_room:${id}`);
    return data;
  };
}
