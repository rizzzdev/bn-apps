import {
  type ExamSupervisor,
  type CreateExamSupervisorDto,
  type UpdateExamSupervisorDto,
} from "./exam-supervisor.types.js";
import {
  type IExamSupervisorRepository,
  type IExamSupervisorService,
} from "./exam-supervisor.interface.js";
import {
  type ExamSupervisorGetByIdQuery,
  type ExamSupervisorGetAllQuery,
} from "./exam-supervisor.query.js";
import { NotFoundError, BadRequestError } from "../../utils/errors.js";
import { type NotificationRepository } from "../notification/notification.repository.js";
import { pushLiveNotifications } from "../notification/notify.js";
import { redisClient } from "../../configs/redis.config.js";

/** Handles ExamSupervisor business logic. Depends on IExamSupervisorRepository. */
export class ExamSupervisorService implements IExamSupervisorService {
  constructor(
    private readonly repository: IExamSupervisorRepository,
    private readonly notificationRepo: NotificationRepository,
  ) {}

  getAll = async (query: ExamSupervisorGetAllQuery): Promise<ExamSupervisor[]> => {
    const version = await redisClient.get("cache_version:exam_supervisor") || "0";
    const cacheKey = `exam_supervisors:list:v${version}:${JSON.stringify(query)}`;
    
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const data = await this.repository.getAll(query);
    
    await redisClient.set(cacheKey, JSON.stringify(data), { EX: 14400 }); // 4 hours
    return data;
  };

  private invalidateCache = async (): Promise<void> => {
    await redisClient.incr("cache_version:exam_supervisor");
  };

  getById = async (id: string, query: ExamSupervisorGetByIdQuery): Promise<ExamSupervisor> => {
    const data = await this.repository.getById(id, query);
    if (!data) {
      throw new NotFoundError("Exam supervisor not found");
    }
    return data;
  };

  private assertUniqueSupervisor = async (
    examRoomId: string,
    userId: string,
    excludeId?: string,
  ): Promise<void> => {
    const existing = await this.repository.getByExamRoomAndUser(examRoomId, userId);
    if (existing && existing.id !== excludeId) {
      throw new BadRequestError("User is already a supervisor for this exam room");
    }
  };

  // Prevents a supervisor from being assigned to two exams scheduled at overlapping
  // times, regardless of room — mirrors the participant overlap rule.
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
        `User sudah menjadi pengawas pada ujian lain (${conflictExamName}) di waktu yang bersamaan.`,
      );
    }
  };

  // Notifies the supervisor that a new exam has been scheduled for them.
  // Best-effort — a notification failure must never block assignment.
  private notifyScheduled = async (userId: string, examRoomId: string): Promise<void> => {
    try {
      const info = await this.repository.getExamRoomScheduleInfo(examRoomId);
      if (!info) return;

      const startLabel = info.startTime.toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        dateStyle: "medium",
        timeStyle: "short",
      });

      const title = "Ujian Baru Dijadwalkan";
      const message = `Anda dijadwalkan sebagai pengawas ujian "${info.examName}" di ${info.roomName}, mulai ${startLabel}.`;
      const meta = [info.examName, info.roomName].filter(Boolean).join(" — ");

      await this.notificationRepo.createMany([
        {
          userId,
          type: "exam_scheduled",
          title,
          message,
          meta,
        },
      ]);
      pushLiveNotifications([userId], "exam_scheduled", title, message, meta);
    } catch {
      // notification save failure should never block assignment
    }
  };

  create = async (dto: CreateExamSupervisorDto): Promise<ExamSupervisor> => {
    await this.assertUniqueSupervisor(dto.examRoomId, dto.userId);
    await this.assertNoScheduleOverlap(dto.userId, dto.examRoomId);
    const created = await this.repository.create(dto);
    await this.notifyScheduled(dto.userId, dto.examRoomId);
    await this.invalidateCache();
    return created;
  };

  updateById = async (id: string, dto: UpdateExamSupervisorDto): Promise<ExamSupervisor> => {
    const existing = await this.getById(id, {});
    if (Object.keys(dto).length === 0) {
      return existing;
    }
    const examRoomId = dto.examRoomId ?? existing.examRoomId;
    const userId = dto.userId ?? existing.userId;
    await this.assertUniqueSupervisor(examRoomId, userId, id);
    if (dto.examRoomId && dto.examRoomId !== existing.examRoomId) {
      await this.assertNoScheduleOverlap(userId, examRoomId, id);
    }
    const data = await this.repository.updateById(id, dto);
    await this.invalidateCache();
    return data;
  };

  deleteById = async (id: string): Promise<ExamSupervisor> => {
    await this.getById(id, {});
    const data = await this.repository.deleteById(id);
    await this.invalidateCache();
    return data;
  };
}
