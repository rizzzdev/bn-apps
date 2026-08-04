import { type Exam, type CreateExamDto, type UpdateExamDto } from "./exam.types.js";
import { type IExamRepository, type IExamService } from "./exam.interface.js";
import { type ExamGetByIdQuery, type ExamGetAllQuery } from "./exam.query.js";
import { NotFoundError, BadRequestError } from "../../utils/errors.js";
import { prisma } from "../../app/database/index.js";
import { redisClient } from "../../configs/redis.config.js";

/** Handles Exam business logic. Depends on IExamRepository. */
export class ExamService implements IExamService {
  constructor(private readonly repository: IExamRepository) {}

  getAll = async (query: ExamGetAllQuery): Promise<Exam[]> => {
    const version = await redisClient.get("cache_version:exam") || "0";
    const cacheKey = `exams:list:v${version}:${JSON.stringify(query)}`;
    
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const data = await this.repository.getAll(query);
    
    await redisClient.set(cacheKey, JSON.stringify(data), { EX: 43200 }); // 12 hours
    return data;
  };

  private invalidateCache = async (): Promise<void> => {
    await redisClient.incr("cache_version:exam");
  };

  getById = async (id: string, query: ExamGetByIdQuery): Promise<Exam> => {
    const data = await this.repository.getById(id, query);
    if (!data) {
      throw new NotFoundError("Exam not found");
    }
    return data;
  };

  create = async (dto: CreateExamDto): Promise<Exam> => {
    const exam = await this.repository.create(dto);
    
    if (exam.questionCreatorId) {
      import("../notification/notify.js").then(({ notifyUsers }) => {
        import("../../app/database/index.js").then(({ prisma }) => {
          void notifyUsers(
            prisma,
            [exam.questionCreatorId!],
            "info",
            "Tugas Pembuatan Soal",
            `Anda telah ditugaskan untuk membuat soal pada ujian: ${exam.name}`
          );
        }).catch(() => {});
      }).catch(() => {});
    }

    await this.invalidateCache();
    return exam;
  };

  updateById = async (id: string, dto: UpdateExamDto): Promise<Exam> => {
    const existing = await this.getById(id, {});
    if (Object.keys(dto).length === 0) {
      return existing;
    }

    if (dto.startTime && dto.startTime.getTime() !== existing.startTime.getTime()) {
      if (dto.startTime <= new Date()) {
        throw new BadRequestError("Waktu mulai harus lebih dari waktu sekarang.");
      }
    }
    if (dto.endTime && dto.endTime.getTime() !== existing.endTime.getTime()) {
      if (dto.endTime <= new Date()) {
        throw new BadRequestError("Waktu selesai harus lebih dari waktu sekarang.");
      }
    }
    const newStart = dto.startTime ?? existing.startTime;
    const newEnd = dto.endTime ?? existing.endTime;
    if (newEnd <= newStart) {
      throw new BadRequestError("Waktu selesai harus lebih dari waktu mulai.");
    }

    if (dto.questionCreatorId !== undefined && dto.questionCreatorId !== existing.questionCreatorId) {
      if (existing.questionCreatorId) {
        const rooms = await prisma.examRoom.findMany({
          where: { examId: id },
          select: { id: true },
        });
        const roomIds = rooms.map((r) => r.id);
        if (roomIds.length > 0) {
          const hasQuestions = await prisma.examQuestion.findFirst({
            where: { examRoomId: { in: roomIds }, deletedAt: null },
          });
          if (hasQuestions) {
            throw new BadRequestError("Pembuat soal lama sudah membuat soal untuk ujian ini.");
          }
        }
      }
    }

    const result = await this.repository.updateById(id, dto);

    if (dto.startTime || dto.endTime) {
      import("../../socket/exam-queue.js").then(({ scheduleExamRoom }) => {
        import("../../app/database/index.js").then(({ prisma }) => {
          prisma.examRoom.findMany({ where: { examId: id } }).then((rooms) => {
            for (const room of rooms) {
              void scheduleExamRoom(room.id, result.startTime, result.endTime);
            }
          });
        });
      }).catch(() => {});
    }

    await this.invalidateCache();
    return result;
  };

  deleteById = async (id: string): Promise<Exam> => {
    await this.getById(id, {});
    const data = await this.repository.deleteById(id);
    await this.invalidateCache();
    return data;
  };
}
