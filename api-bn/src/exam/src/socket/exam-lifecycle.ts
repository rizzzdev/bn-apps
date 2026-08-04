import { type Server } from "socket.io";
import { prisma } from "#exam/database/index.js";
import { redisClient } from "#exam/configs/redis.config.js";
import { getOrchestrator } from "#app/orchestrator.js";
import { type ClientToServerEvents, type ServerToClientEvents, type SocketData } from "./socket.types.js";
import { redisKeys } from "./socket-keys.js";
import { ExamLogRepository } from "#exam/modules/exam-log/exam-log.repository.js";
import { notifyUsers } from "#exam/modules/notification/index.js";
import { forceSubmitAbsentParticipants } from "#exam/modules/exam-room/exam-room.submit.js";

const examLogRepo = new ExamLogRepository(prisma);

type ExamServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

async function saveAdminNotifications(
  type: string,
  title: string,
  message: string,
  meta?: string,
): Promise<void> {
  try {
    const admins = await getOrchestrator().authData.findAllByRoles(["super_admin"]);
    await notifyUsers(prisma, admins.map((a) => a.id), type, title, message, meta);
  } catch {
    // notification save failure should never crash the lifecycle sweep
  }
}

async function saveRoomNotifications(
  examRoomId: string,
  type: string,
  title: string,
  message: string,
  meta?: string,
): Promise<void> {
  try {
    const [participants, supervisors] = await Promise.all([
      prisma.examParticipant.findMany({ where: { examRoomId }, select: { userId: true } }),
      prisma.examSupervisor.findMany({ where: { examRoomId }, select: { userId: true } }),
    ]);
    const userIds = [
      ...new Set([...participants.map((p) => p.userId), ...supervisors.map((s) => s.userId)]),
    ];
    await notifyUsers(prisma, userIds, type, title, message, meta);
  } catch {
    // notification save failure should never crash the lifecycle sweep
  }
}

async function saveLog(examRoomId: string, type: string, message: string): Promise<void> {
  try {
    await examLogRepo.create({ examRoomId, type, message });
  } catch {
    // logging failure should never crash the lifecycle sweep
  }
}

/**
 * Flips a PENDING room to ONGOING once its exam's startTime has passed,
 * broadcasting + notifying exactly once. Called both reactively (on
 * socket join/subscribe) and periodically (BullMQ sweep), so the
 * transition fires reliably even with nobody connected at the exact moment.
 */
export const autoStartIfTime = async (examRoomId: string, io: ExamServer): Promise<string | null> => {
  let startedAt = await redisClient.get(redisKeys.started(examRoomId));
  if (startedAt) return startedAt;

  const examRoom = await prisma.examRoom.findFirst({
    where: { id: examRoomId, deletedAt: null },
    include: { exam: true, room: { select: { name: true } } },
  });
  if (!examRoom?.exam) return null;

  const now = new Date();
  if (new Date(examRoom.exam.startTime) > now) return null; // Not yet time

  startedAt = new Date(examRoom.exam.startTime).toISOString();
  await redisClient.set(redisKeys.started(examRoomId), startedAt);

  if (examRoom.status === "PENDING") {
    await prisma.examRoom.update({ where: { id: examRoomId }, data: { status: "ONGOING" } });
    const examName = examRoom.exam.name;
    const roomName = examRoom.room?.name ?? "";
    io.to(redisKeys.participantRoom(examRoomId)).emit("exam:started", { examRoomId, startedAt });
    io.to(redisKeys.supervisorRoom(examRoomId)).emit("exam:started", {
      examRoomId,
      startedAt,
      examName,
      roomName,
    });
    io.to(`status:${examRoomId}`).emit("exam:started", { examRoomId, startedAt });
    io.to("admins").emit("exam:started", { examRoomId, startedAt, examName, roomName });
    void saveAdminNotifications(
      "exam_start",
      "Ujian Dimulai",
      "Ujian telah dimulai.",
      [examName, roomName].filter(Boolean).join(" — "),
    );
    void saveRoomNotifications(
      examRoomId,
      "exam_start",
      "Ujian Dimulai",
      `Ujian "${examName}" di ${roomName} telah dimulai.`,
      [examName, roomName].filter(Boolean).join(" — "),
    );
    await saveLog(examRoomId, "system", "Ujian dimulai otomatis sesuai jadwal.");
  }

  return startedAt;
};

/**
 * Flips an ONGOING room to ENDED once its exam's endTime has passed,
 * broadcasting + notifying and force-submitting absent participants exactly
 * once. See autoStartIfTime for why this also runs on a periodic sweep.
 */
export const autoEndIfTime = async (examRoomId: string, io: ExamServer): Promise<string | null> => {
  const examRoom = await prisma.examRoom.findFirst({
    where: { id: examRoomId, deletedAt: null },
    include: { exam: true, room: { select: { name: true } } },
  });
  if (!examRoom?.exam) return null;

  const endedAt = new Date(examRoom.exam.endTime).toISOString();
  if (new Date(endedAt) > new Date()) return null; // Not yet ended

  if (examRoom.status !== "ENDED") {
    await prisma.examRoom.update({ where: { id: examRoomId }, data: { status: "ENDED" } });
    const examName = examRoom.exam.name;
    const roomName = examRoom.room?.name ?? "";
    io.to(redisKeys.participantRoom(examRoomId)).emit("exam:ended", { examRoomId, endedAt });
    io.to(redisKeys.supervisorRoom(examRoomId)).emit("exam:ended", {
      examRoomId,
      endedAt,
      examName,
      roomName,
    });
    io.to(`status:${examRoomId}`).emit("exam:ended", { examRoomId, endedAt });
    io.to("admins").emit("exam:ended", { examRoomId, endedAt, examName, roomName });
    void saveAdminNotifications(
      "exam_end",
      "Ujian Berakhir",
      "Ujian telah berakhir.",
      [examName, roomName].filter(Boolean).join(" — "),
    );
    void saveRoomNotifications(
      examRoomId,
      "exam_end",
      "Ujian Berakhir",
      `Ujian "${examName}" di ${roomName} telah berakhir.`,
      [examName, roomName].filter(Boolean).join(" — "),
    );
    await saveLog(examRoomId, "system", "Ujian telah berakhir.");

    try {
      const { examQueue } = await import("./exam-queue.js");
      await examQueue.add("exam-force-submit", { examRoomId }, { jobId: `exam-submit-${examRoomId}`, removeOnComplete: true });
    } catch {
      // best-effort — must never block the status transition
    }
  }

  return endedAt;
};
