import { type PrismaClient } from '#exam/database/index.js';
import { type ExamLog, type CreateExamLogDto } from './exam-log.types.js';

export class ExamLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  getAll = (examRoomId: string, limit = 200): Promise<ExamLog[]> => {
    return this.prisma.examLog.findMany({
      where: { examRoomId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    }) as unknown as Promise<ExamLog[]>;
  };

  create = (dto: CreateExamLogDto): Promise<ExamLog> => {
    return this.prisma.examLog.create({
      data: {
        examRoomId: dto.examRoomId,
        userId: dto.userId ?? null,
        type: dto.type,
        message: dto.message,
      },
    }) as unknown as Promise<ExamLog>;
  };
}
