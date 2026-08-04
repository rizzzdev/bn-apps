import { type PrismaClient } from "../../app/database/generated/client.js";
import { type Exam, type CreateExamDto, type UpdateExamDto } from "./exam.types.js";
import { type IExamRepository } from "./exam.interface.js";
import { type ExamGetByIdQuery, type ExamGetAllQuery } from "./exam.query.js";
import { ALIVE } from "../../utils/constants.js";
import { now } from "../../utils/datetime.js";

/** Handles all Exam database operations via Prisma. Contains no business logic. */
export class ExamRepository implements IExamRepository {
  constructor(private readonly prisma: PrismaClient) {}

  getAll = async (query: ExamGetAllQuery): Promise<Exam[]> => {
    const { page = 1, limit = 10 } = query;
    const result = await this.prisma.exam.findMany({
      where: {
        deletedAt: ALIVE,
        ...(query.name !== undefined && { name: { contains: query.name, mode: "insensitive" } }),
        ...(query.questionCreatorId !== undefined && {
          questionCreatorId: query.questionCreatorId,
        }),
      },
      include: {
        examRooms: query.examRooms ?? false,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return result as unknown as Exam[];
  };

  getById = async (id: string, query: ExamGetByIdQuery): Promise<Exam | null> => {
    const result = await this.prisma.exam.findFirst({
      where: { id, deletedAt: ALIVE },
      include: {
        examRooms: query.examRooms ?? false,
      },
    });
    return result as unknown as Exam | null;
  };

  create = async (dto: CreateExamDto): Promise<Exam> => {
    const result = await this.prisma.exam.create({ data: dto });
    return result as unknown as Exam;
  };

  updateById = async (id: string, dto: UpdateExamDto): Promise<Exam> => {
    const result = await this.prisma.exam.update({ where: { id }, data: dto });
    return result as unknown as Exam;
  };

  deleteById = async (id: string): Promise<Exam> => {
    const result = await this.prisma.$transaction(async (tx) => {
      const examRooms = await tx.examRoom.findMany({
        where: { examId: id },
      });

      const examRoomIds = examRooms.map((r) => r.id);

      // Hard-delete records that have no deletedAt field
      await tx.essayGrade.deleteMany({ where: { examRoomId: { in: examRoomIds } } });
      await tx.examLog.deleteMany({ where: { examRoomId: { in: examRoomIds } } });
      await tx.examAnswer.deleteMany({ where: { examRoomId: { in: examRoomIds } } });
      await tx.examScore.deleteMany({ where: { examRoomId: { in: examRoomIds } } });
      await tx.examParticipant.deleteMany({ where: { examRoomId: { in: examRoomIds } } });
      await tx.examSupervisor.deleteMany({ where: { examRoomId: { in: examRoomIds } } });

      // Soft-delete records that have deletedAt
      await tx.examQuestion.updateMany({
        where: { examRoomId: { in: examRoomIds } },
        data: { deletedAt: now() },
      });
      await tx.examRoom.updateMany({
        where: { examId: id },
        data: { deletedAt: now() },
      });

      const result = await tx.exam.updateMany({
        where: { id },
        data: { deletedAt: now() },
      });

      return result;
    });
    return result as unknown as Exam;
  };
}
