import {
  type ExamParticipant,
  type CreateExamParticipantDto,
  type UpdateExamParticipantDto,
} from './exam-participant.types.js';
import {
  type IExamParticipantRepository,
  type IExamParticipantService,
} from './exam-participant.interface.js';
import {
  type ExamParticipantGetByIdQuery,
  type ExamParticipantGetAllQuery,
} from './exam-participant.query.js';
import { NotFoundError, BadRequestError } from '#app/errors/index.js';
import { type NotificationRepository } from '#exam/modules/notification/index.js';
import { pushLiveNotifications } from '#exam/modules/notification/index.js';
import { redisClient } from '#exam/configs/redis.config.js';

/** Handles ExamParticipant business logic. Depends on IExamParticipantRepository. */
export class ExamParticipantService implements IExamParticipantService {
  constructor(
    private readonly repository: IExamParticipantRepository,
    private readonly notificationRepo: NotificationRepository,
  ) {}

  getAll = async (query: ExamParticipantGetAllQuery): Promise<ExamParticipant[]> => {
    const version = (await redisClient.get('cache_version:exam_participant')) || '0';
    const cacheKey = `exam_participants:v${version}:${JSON.stringify(query)}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const data = await this.repository.getAll(query);

    await redisClient.set(cacheKey, JSON.stringify(data), { EX: 3600 });
    return data;
  };

  private invalidateCache = async (): Promise<void> => {
    await redisClient.incr('cache_version:exam_participant');
  };

  getById = async (id: string, query: ExamParticipantGetByIdQuery): Promise<ExamParticipant> => {
    const data = await this.repository.getById(id, query);
    if (!data) {
      throw new NotFoundError('Exam participant not found');
    }
    return data;
  };

  private assertUniqueParticipant = async (
    examRoomId: string,
    userId: string,
    excludeId?: string,
  ): Promise<void> => {
    const existing = await this.repository.getByExamRoomAndUser(examRoomId, userId);
    if (existing && existing.id !== excludeId) {
      throw new BadRequestError('User is already a participant for this exam room');
    }
  };

  // Prevents a user from being a participant in two exams scheduled at overlapping times,
  // regardless of room.
  private assertNoScheduleOverlap = async (
    userId: string,
    examRoomId: string,
    excludeId?: string,
  ): Promise<void> => {
    const conflictExamName = await this.repository.findScheduleConflictExamName(
      userId,
      examRoomId,
      excludeId,
    );
    if (conflictExamName) {
      throw new BadRequestError(
        `User sudah terdaftar pada ujian lain (${conflictExamName}) di waktu yang bersamaan.`,
      );
    }
  };

  private assertCapacityNotExceeded = async (
    examRoomId: string,
    additionalCount: number = 1,
  ): Promise<void> => {
    const status = await this.repository.getRoomCapacityStatus(examRoomId);
    if (!status) return;

    if (status.occupied + additionalCount > status.capacity) {
      throw new BadRequestError(
        `Kapasitas ruangan sudah penuh pada rentang waktu ini (Sisa kursi: ${Math.max(0, status.capacity - status.occupied)})`,
      );
    }
  };

  // Notifies the participant that a new exam has been scheduled for them.
  // Best-effort — a notification failure must never block enrollment.
  private notifyScheduled = async (userId: string, examRoomId: string): Promise<void> => {
    try {
      const info = await this.repository.getExamRoomScheduleInfo(examRoomId);
      if (!info) return;

      const startLabel = info.startTime.toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        dateStyle: 'medium',
        timeStyle: 'short',
      });

      const title = 'Ujian Baru Dijadwalkan';
      const message = `Anda dijadwalkan sebagai peserta ujian "${info.examName}" di ${info.roomName}, mulai ${startLabel}.`;
      const meta = [info.examName, info.roomName].filter(Boolean).join(' — ');

      await this.notificationRepo.createMany([
        {
          userId,
          type: 'exam_scheduled',
          title,
          message,
          meta,
        },
      ]);
      pushLiveNotifications([userId], 'exam_scheduled', title, message, meta);
    } catch {
      // notification save failure should never block enrollment
    }
  };

  create = async (dto: CreateExamParticipantDto): Promise<ExamParticipant> => {
    await this.assertUniqueParticipant(dto.examRoomId, dto.userId);
    await this.assertNoScheduleOverlap(dto.userId, dto.examRoomId);
    await this.assertCapacityNotExceeded(dto.examRoomId, 1);
    const created = await this.repository.create(dto);
    await this.notifyScheduled(dto.userId, dto.examRoomId);
    await this.invalidateCache();
    return created;
  };

  updateById = async (id: string, dto: UpdateExamParticipantDto): Promise<ExamParticipant> => {
    const existing = await this.getById(id, {});
    if (Object.keys(dto).length === 0) {
      return existing;
    }
    const examRoomId = dto.examRoomId ?? existing.examRoomId;
    const userId = dto.userId ?? existing.userId;
    await this.assertUniqueParticipant(examRoomId, userId, id);
    if (dto.examRoomId && dto.examRoomId !== existing.examRoomId) {
      await this.assertNoScheduleOverlap(userId, examRoomId, id);
      await this.assertCapacityNotExceeded(examRoomId, 1);
    }
    const data = await this.repository.updateById(id, dto);
    await this.invalidateCache();
    return data;
  };

  deleteById = async (id: string): Promise<ExamParticipant> => {
    await this.getById(id, {});
    const data = await this.repository.deleteById(id);
    await this.invalidateCache();
    return data;
  };
}
