import { type PrismaClient } from "../../app/database/generated/client.js";
import {
  type ExamRoom,
  type CreateExamRoomDto,
  type UpdateExamRoomDto,
} from "./exam-room.types.js";
import { type IExamRoomRepository } from "./exam-room.interface.js";
import { type ExamRoomGetByIdQuery, type ExamRoomGetAllQuery } from "./exam-room.query.js";
import { ALIVE } from "../../utils/constants.js";

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
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    })) as unknown as ExamRoom[];
  };

  getById = async (id: string, _query: ExamRoomGetByIdQuery): Promise<ExamRoom | null> => {
    return (await this.prisma.examRoom.findFirst({
      where: { id, deletedAt: ALIVE },
    })) as unknown as ExamRoom | null;
  };

  create = async (dto: CreateExamRoomDto): Promise<ExamRoom> => {
    return (await this.prisma.examRoom.create({ data: dto })) as unknown as ExamRoom;
  };

  updateById = async (id: string, dto: UpdateExamRoomDto): Promise<ExamRoom> => {
    return (await this.prisma.examRoom.update({ where: { id }, data: dto })) as unknown as ExamRoom;
  };

  deleteById = async (id: string): Promise<ExamRoom> => {
    return (await this.prisma.examRoom.update({
      where: { id },
      data: { deletedAt: new Date() },
    })) as unknown as ExamRoom;
  };
}
