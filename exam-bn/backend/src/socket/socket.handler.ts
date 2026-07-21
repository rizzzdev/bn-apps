import { type Server, type Socket } from "socket.io";
import { redisClient } from "../configs/redis.config.js";
import { prisma } from "../app/database/index.js";
import {
  ViolationType,
  type ExamSession,
  type ParticipantStatus,
  type ClientToServerEvents,
  type ServerToClientEvents,
  type SocketData,
} from "./socket.types.js";
import { logger } from "../utils/logger.js";
import { ExamLogRepository } from "../modules/exam-log/exam-log.repository.js";
import { ChatRepository } from "../modules/chat/index.js";
import { notifyUsers } from "../modules/notification/index.js";
import { redisKeys } from "./socket-keys.js";
import { autoStartIfTime, autoEndIfTime } from "./exam-lifecycle.js";

const examLogRepo = new ExamLogRepository(prisma);
const chatRepo = new ChatRepository(prisma);

// Max violations a regular supervisor may unlock past — beyond this, only an
// admin can unlock the participant (see handleUnlock).
const SUPERVISOR_UNLOCK_VIOLATION_LIMIT = 5;

async function saveAdminNotifications(
  type: string,
  title: string,
  message: string,
  meta?: string,
): Promise<void> {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", deletedAt: null },
      select: { id: true },
    });
    await notifyUsers(prisma, admins.map((a) => a.id), type, title, message, meta);
  } catch {
    // notification save failure should never crash the socket handler
  }
}

async function saveSupervisorAndAdminNotifications(
  examRoomId: string,
  type: string,
  title: string,
  message: string,
  meta?: string,
): Promise<void> {
  try {
    const [admins, supervisors] = await Promise.all([
      prisma.user.findMany({ where: { role: "ADMIN", deletedAt: null }, select: { id: true } }),
      prisma.examSupervisor.findMany({ where: { examRoomId }, select: { userId: true } })
    ]);
    const userIds = [
      ...new Set([...admins.map(a => a.id), ...supervisors.map(s => s.userId)])
    ];
    await notifyUsers(prisma, userIds, type, title, message, meta);
  } catch {
    // notification save failure should never crash the socket handler
  }
}

// Notifies every participant and supervisor of an exam room (e.g. on exam
// start/end) — separate from saveAdminNotifications, which targets admins only.
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
    // notification save failure should never crash the socket handler
  }
}

async function saveDirectNotification(
  receiverId: string,
  senderName: string,
  senderRole: string,
  message: string,
): Promise<void> {
  try {
    const title = senderRole === "SUPERVISOR" ? "Pesan dari Pengawas" : "Pesan dari Admin";
    await notifyUsers(prisma, [receiverId], "chat", title, `${senderName}: ${message}`);
  } catch {
    // notification save failure should never crash the socket handler
  }
}

async function saveLog(examRoomId: string, type: string, message: string, userId?: string | null) {
  try {
    await examLogRepo.create({ examRoomId, type, message, userId });
  } catch {
    // logging failure should never crash the socket handler
  }
}

type ExamSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;
type ExamServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

// ─── Session Helpers ─────────────────────────────────────────────────────────

const getOrCreateSession = async (
  examRoomId: string,
  userId: string,
  username: string,
): Promise<ExamSession> => {
  const key = redisKeys.session(examRoomId, userId);
  const existing = await redisClient.get(key);

  if (existing) {
    return JSON.parse(existing) as ExamSession;
  }

  const session: ExamSession = {
    userId,
    username,
    examRoomId,
    startedAt: new Date().toISOString(),
    currentQuestionIndex: 0,
    isLocked: false,
    violationCount: 0,
    lastViolationType: null,
  };

  await redisClient.set(key, JSON.stringify(session), { EX: 43200 });
  return session;
};

const updateSession = async (
  examRoomId: string,
  userId: string,
  updates: Partial<ExamSession>,
): Promise<ExamSession> => {
  const key = redisKeys.session(examRoomId, userId);
  const existing = await redisClient.get(key);
  const session = existing
    ? (JSON.parse(existing) as ExamSession)
    : ({
        userId,
        examRoomId,
        startedAt: new Date().toISOString(),
        currentQuestionIndex: 0,
        isLocked: false,
        violationCount: 0,
        lastViolationType: null,
      } as ExamSession);

  const updated = { ...session, ...updates };
  await redisClient.set(key, JSON.stringify(updated), { EX: 43200 });
  return updated;
};

// ─── Get all participant statuses for a room ──────────────────────────────────

export const getRoomParticipantStatuses = async (
  examRoomId: string,
): Promise<ParticipantStatus[]> => {
  const participants = await prisma.examParticipant.findMany({
    where: { examRoomId },
    include: { user: { select: { id: true, username: true, fullname: true } } },
  });

  const statuses: ParticipantStatus[] = await Promise.all(
    participants.map(async (p) => {
      const sessionStr = await redisClient.get(redisKeys.session(examRoomId, p.userId));
      const session = sessionStr ? (JSON.parse(sessionStr) as ExamSession) : null;
      const socketId = await redisClient.get(redisKeys.socketId(examRoomId, p.userId));
      return {
        userId: p.userId,
        username: p.user.username,
        fullname: p.user.fullname,
        isLocked: session?.isLocked ?? false,
        violationCount: session?.violationCount ?? 0,
        lastViolationType: session?.lastViolationType ?? null,
        isOnline: !!socketId,
      };
    }),
  );

  return statuses;
};

// ─── Fetch exam + room name helper ───────────────────────────────────────────

async function getExamRoomMeta(
  examRoomId: string,
): Promise<{ examName: string; roomName: string }> {
  const er = await prisma.examRoom.findFirst({
    where: { id: examRoomId },
    include: { exam: { select: { name: true } }, room: { select: { name: true } } },
  });
  return {
    examName: er?.exam?.name ?? "",
    roomName: er?.room?.name ?? "",
  };
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

export const handleStatusSubscribe = async (
  socket: ExamSocket,
  io: ExamServer,
  payload: { examRoomIds: string[] },
): Promise<void> => {
  const { examRoomIds } = payload;
  for (const examRoomId of examRoomIds) {
    // Join a lightweight status-only room (separate from the full participant room)
    await socket.join(`status:${examRoomId}`);
    // Push current status immediately so the client doesn't need to poll
    const endedAt = await autoEndIfTime(examRoomId, io);
    if (endedAt) {
      socket.emit("exam:ended", { examRoomId, endedAt });
    } else {
      const startedAt = await autoStartIfTime(examRoomId, io);
      if (startedAt) socket.emit("exam:started", { examRoomId, startedAt });
    }
  }
};

export const handleParticipantJoin = async (
  socket: ExamSocket,
  io: ExamServer,
  payload: { examRoomId: string },
): Promise<void> => {
  const { examRoomId } = payload;
  const { userId, username, fullname } = socket.data;

  const participant = await prisma.examParticipant.findFirst({
    where: { examRoomId, userId },
  });

  if (!participant) {
    socket.emit("exam:error", { message: "You are not a participant in this exam room." });
    return;
  }

  await socket.join(redisKeys.participantRoom(examRoomId));
  
  const oldSocketId = await redisClient.get(redisKeys.socketId(examRoomId, userId));
  if (oldSocketId && oldSocketId !== socket.id) {
    const oldSocket = io.sockets.sockets.get(oldSocketId);
    if (oldSocket) {
      oldSocket.emit("exam:error", { message: "Sesi Anda telah diputus karena login dari perangkat lain." });
      oldSocket.disconnect(true);
    }
  }

  // Clear any existing disconnect timeout for this user (Grace Period Cancel)
  const disconnectTimerKey = `exam_disconnect_timer:${examRoomId}:${userId}`;
  const timerExists = await redisClient.exists(disconnectTimerKey);
  if (timerExists) {
    await redisClient.del(disconnectTimerKey);
  }

  await redisClient.set(redisKeys.socketId(examRoomId, userId), socket.id, { EX: 43200 });

  const session = await getOrCreateSession(examRoomId, userId, username);
  socket.emit("exam:session", session);

  // Check if exam ended first, then if it started
  const endedAt = await autoEndIfTime(examRoomId, io);
  if (endedAt) {
    socket.emit("exam:ended", { examRoomId, endedAt });
  } else {
    const startedAt = await autoStartIfTime(examRoomId, io);
    if (startedAt) socket.emit("exam:started", { examRoomId, startedAt });
  }

  if (session.isLocked) {
    socket.emit("exam:locked", {
      reason: "Your exam session is currently locked.",
      violationType: session.lastViolationType ?? ViolationType.WINDOW_CLOSED,
      violationCount: session.violationCount,
    });
  }

  const statuses = await getRoomParticipantStatuses(examRoomId);
  io.to(redisKeys.supervisorRoom(examRoomId)).emit("exam:room:status", statuses);

  // Notify admins and supervisors of participant join
  const { examName, roomName } = await getExamRoomMeta(examRoomId);
  io.to(redisKeys.supervisorRoom(examRoomId)).emit("exam:participant:joined", {
    userId,
    username,
    fullname,
    examRoomId,
    examName,
    roomName,
  });
  io.to("admins").emit("exam:participant:joined", {
    userId,
    username,
    fullname,
    examRoomId,
    examName,
    roomName,
  });
  void saveSupervisorAndAdminNotifications(
    examRoomId,
    "participant_join",
    "Peserta Bergabung",
    `${fullname} bergabung ke ruangan.`,
    [examName, roomName].filter(Boolean).join(" - "),
  );

  await saveLog(examRoomId, "join", `Peserta ${fullname} bergabung.`, userId);
  logger.info({ userId, examRoomId }, "Participant joined exam room");
};

export const handleSupervisorJoin = async (
  socket: ExamSocket,
  io: ExamServer,
  payload: { examRoomId: string },
): Promise<void> => {
  const { examRoomId } = payload;
  const { userId } = socket.data;

  const supervisor = await prisma.examSupervisor.findFirst({
    where: { examRoomId, userId },
  });

  if (!supervisor) {
    socket.emit("exam:error", { message: "You are not a supervisor in this exam room." });
    return;
  }

  await socket.join(redisKeys.supervisorRoom(examRoomId));

  const statuses = await getRoomParticipantStatuses(examRoomId);
  socket.emit("exam:room:status", statuses);

  // Check if exam ended first, then if it started
  const endedAt = await autoEndIfTime(examRoomId, io);
  if (endedAt) {
    socket.emit("exam:ended", { examRoomId, endedAt });
  } else {
    const startedAt = await autoStartIfTime(examRoomId, io);
    if (startedAt) socket.emit("exam:started", { examRoomId, startedAt });
  }

  logger.info({ userId, examRoomId }, "Supervisor joined exam room");
};

// Lets an admin join the same supervisor room (status/log broadcasts, unlock,
// warn) for any exam room, without needing an ExamSupervisor row — backs the
// admin "Pantau Ruangan" monitoring view.
export const handleMonitorJoin = async (
  socket: ExamSocket,
  io: ExamServer,
  payload: { examRoomId: string },
): Promise<void> => {
  const { examRoomId } = payload;
  const { userId, role } = socket.data;

  if (role !== "ADMIN") {
    socket.emit("exam:error", { message: "Hanya admin yang dapat memantau dengan cara ini." });
    return;
  }

  await socket.join(redisKeys.supervisorRoom(examRoomId));

  const statuses = await getRoomParticipantStatuses(examRoomId);
  socket.emit("exam:room:status", statuses);

  const endedAt = await autoEndIfTime(examRoomId, io);
  if (endedAt) {
    socket.emit("exam:ended", { examRoomId, endedAt });
  } else {
    const startedAt = await autoStartIfTime(examRoomId, io);
    if (startedAt) socket.emit("exam:started", { examRoomId, startedAt });
  }

  logger.info({ userId, examRoomId }, "Admin joined exam room monitor");
};

export const handleViolation = async (
  socket: ExamSocket,
  io: ExamServer,
  payload: { examRoomId: string; violationType: ViolationType },
): Promise<void> => {
  const { examRoomId, violationType } = payload;
  const { userId, username } = socket.data;

  const participant = await prisma.examParticipant.findFirst({
    where: { examRoomId, userId },
    include: { user: { select: { fullname: true } } },
  });

  if (!participant) {
    socket.emit("exam:error", { message: "You are not a participant in this exam room." });
    return;
  }

  // Do not record violations after submission
  if (participant.status === "SUBMITTED") return;

  const violationCount = await redisClient.incr(redisKeys.violations(examRoomId, userId));

  const session = await updateSession(examRoomId, userId, {
    isLocked: true,
    violationCount,
    lastViolationType: violationType,
  });

  await redisClient.set(redisKeys.lock(examRoomId, userId), violationType, { EX: 43200 });

  if (socket?.emit) {
    socket.emit("exam:locked", {
      reason: `Exam locked due to: ${violationType}`,
      violationType,
      violationCount: session.violationCount,
    });
  }

  const fullname = participant.user.fullname;
  const { examName, roomName } = await getExamRoomMeta(examRoomId);

  io.to(redisKeys.supervisorRoom(examRoomId)).emit("exam:participant:violated", {
    userId,
    username,
    fullname,
    violationType,
    violationCount,
    examRoomId,
    examName,
    roomName,
  });
  io.to("admins").emit("exam:participant:violated", {
    userId,
    username,
    fullname,
    violationType,
    violationCount,
    examRoomId,
    examName,
    roomName,
  });
  void saveAdminNotifications(
    "violation",
    "Pelanggaran Terdeteksi",
    `${fullname} melakukan pelanggaran: ${violationType} (ke-${violationCount}).`,
    [examName, roomName].filter(Boolean).join(" — "),
  );

  // Crossing the supervisor-unlock limit — only an admin can unlock this
  // participant from now on, so alert admins to take over.
  if (violationCount === SUPERVISOR_UNLOCK_VIOLATION_LIMIT + 1) {
    void saveAdminNotifications(
      "violation",
      "Peserta Melebihi Batas Pelanggaran",
      `${fullname} telah melanggar lebih dari ${SUPERVISOR_UNLOCK_VIOLATION_LIMIT} kali. Hanya admin yang dapat membuka kuncinya.`,
      [examName, roomName].filter(Boolean).join(" — "),
    );
  }

  const statuses = await getRoomParticipantStatuses(examRoomId);
  io.to(redisKeys.supervisorRoom(examRoomId)).emit("exam:room:status", statuses);

  await saveLog(
    examRoomId,
    "violation",
    `Pelanggaran oleh ${fullname}: ${violationType} (ke-${violationCount}).`,
    userId,
  );
  logger.warn(
    { userId, examRoomId, violationType, violationCount },
    "Participant violation recorded",
  );
};

export const handleUnlock = async (
  socket: ExamSocket,
  io: ExamServer,
  payload: { examRoomId: string; participantUserId: string },
): Promise<void> => {
  const { examRoomId, participantUserId } = payload;
  const { userId: supervisorId, fullname: supervisorFullname, role } = socket.data;

  const isAdmin = role === "ADMIN";
  if (!isAdmin) {
    const supervisor = await prisma.examSupervisor.findFirst({
      where: { examRoomId, userId: supervisorId },
    });
    if (!supervisor) {
      socket.emit("exam:error", { message: "Only supervisors can unlock participants." });
      return;
    }

    const sessionStr = await redisClient.get(redisKeys.session(examRoomId, participantUserId));
    const violationCount = sessionStr
      ? ((JSON.parse(sessionStr) as ExamSession).violationCount ?? 0)
      : 0;
    if (violationCount > SUPERVISOR_UNLOCK_VIOLATION_LIMIT) {
      socket.emit("exam:error", {
        message: "Peserta ini telah melebihi batas pelanggaran. Hanya admin yang dapat membuka kuncinya.",
      });
      return;
    }
  }

  await redisClient.del(redisKeys.lock(examRoomId, participantUserId));
  await updateSession(examRoomId, participantUserId, { isLocked: false });

  const participantSocketId = await redisClient.get(
    redisKeys.socketId(examRoomId, participantUserId),
  );
  if (participantSocketId) {
    io.to(participantSocketId).emit("exam:unlocked");
  }

  const statuses = await getRoomParticipantStatuses(examRoomId);
  io.to(redisKeys.supervisorRoom(examRoomId)).emit("exam:room:status", statuses);

  const participantUser = await prisma.user.findFirst({
    where: { id: participantUserId },
    select: { fullname: true },
  });

  await saveLog(
    examRoomId,
    "system",
    `${participantUser?.fullname ?? participantUserId} dibuka kuncinya oleh ${supervisorFullname}.`,
    supervisorId,
  );
  logger.info(
    { supervisorId, participantUserId, examRoomId },
    "Participant unlocked by supervisor",
  );
};

export const handleStart = async (
  socket: ExamSocket,
  io: ExamServer,
  payload: { examRoomId: string },
): Promise<void> => {
  const { examRoomId } = payload;
  const { userId } = socket.data;

  const supervisor = await prisma.examSupervisor.findFirst({
    where: { examRoomId, userId },
  });

  if (!supervisor) {
    socket.emit("exam:error", { message: "Hanya pengawas yang dapat memulai ujian." });
    return;
  }

  const startedAt = new Date().toISOString();
  await redisClient.set(redisKeys.started(examRoomId), startedAt, { EX: 43200 });
  await prisma.examRoom.update({ where: { id: examRoomId }, data: { status: "ONGOING" } });

  const { examName, roomName } = await getExamRoomMeta(examRoomId);

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

  await saveLog(examRoomId, "system", "Ujian dimulai oleh pengawas.", userId);
  logger.info({ userId, examRoomId }, "Exam started by supervisor");
};

export const handleWarn = async (
  socket: ExamSocket,
  io: ExamServer,
  payload: { examRoomId: string; targetUserId: string; message: string },
): Promise<void> => {
  const { examRoomId, targetUserId, message } = payload;
  const { userId: supervisorId, fullname: supervisorFullname, role } = socket.data;

  try {
    if (role !== "ADMIN") {
      const supervisor = await prisma.examSupervisor.findFirst({
        where: { examRoomId, userId: supervisorId },
      });

      if (!supervisor) {
        socket.emit("exam:error", { message: "Only supervisors can send warnings." });
        return;
      }
    }

    const participantSocketId = await redisClient.get(redisKeys.socketId(examRoomId, targetUserId));
    if (!participantSocketId) {
      socket.emit("exam:error", { message: "Peserta tidak terhubung saat ini." });
      return;
    }

    io.to(participantSocketId).emit("exam:warn", { message, fromName: supervisorFullname });

    const targetUser = await prisma.user.findFirst({
      where: { id: targetUserId },
      select: { fullname: true },
    });

    io.to(redisKeys.supervisorRoom(examRoomId)).emit("exam:participant:warned", {
      userId: targetUserId,
      fullname: targetUser?.fullname ?? targetUserId,
    });

    await saveLog(
      examRoomId,
      "warning",
      `Peringatan dikirim ke ${targetUser?.fullname ?? targetUserId} oleh ${supervisorFullname}: "${message}"`,
      supervisorId,
    );
    logger.info({ supervisorId, targetUserId, examRoomId }, "Warning sent to participant");
  } catch (err) {
    logger.error({ err, supervisorId, targetUserId, examRoomId }, "Failed to send warning");
    socket.emit("exam:error", { message: "Gagal mengirim peringatan." });
  }
};

const CHAT_ROLES = new Set(["ADMIN", "SUPERVISOR"]);

export const handleChatSend = async (
  socket: ExamSocket,
  io: ExamServer,
  payload: { receiverId: string; message: string; replyToId?: string },
): Promise<void> => {
  const { receiverId, message, replyToId } = payload;
  const { userId: senderId, role: senderRole } = socket.data;

  if (!message?.trim() || !receiverId) return;

  try {
    if (!CHAT_ROLES.has(senderRole)) {
      socket.emit("exam:error", {
        message: "Hanya admin dan pengawas yang dapat menggunakan chat ini.",
      });
      return;
    }

    const receiver = await prisma.user.findFirst({
      where: { id: receiverId, deletedAt: null },
      select: { id: true, fullname: true, role: true },
    });

    if (!receiver || !CHAT_ROLES.has(receiver.role) || receiver.role === senderRole) {
      socket.emit("exam:error", {
        message: "Penerima tidak valid. Chat hanya berlaku antara admin dan pengawas.",
      });
      return;
    }

    const chat = await chatRepo.create({
      senderId,
      receiverId,
      message: message.trim(),
      replyToId: replyToId ?? null,
    });

    const payloadOut = {
      id: chat.id,
      senderId,
      senderName: chat.sender.fullname,
      senderRole,
      receiverId,
      receiverName: receiver.fullname,
      receiverRole: receiver.role,
      message: message.trim(),
      timestamp: chat.createdAt.toISOString(),
      replyToId: chat.replyToId ?? null,
      replyTo: chat.replyTo ?? null,
    };

    io.to(redisKeys.userRoom(receiverId)).emit("chat:message", payloadOut);
    io.to(redisKeys.userRoom(senderId)).emit("chat:message", payloadOut);

    io.to(redisKeys.userRoom(receiverId)).emit("chat:notify", {
      senderId,
      senderName: chat.sender.fullname,
      senderRole,
      message: message.trim(),
      timestamp: chat.createdAt.toISOString(),
    });

    void saveDirectNotification(receiverId, chat.sender.fullname, senderRole, message.trim());

    logger.info({ senderId, receiverId, senderRole }, "Chat message sent");
  } catch (err) {
    logger.error({ err, senderId, receiverId }, "Failed to save chat message");
    socket.emit("exam:error", { message: "Gagal mengirim pesan. Silakan coba lagi." });
  }
};

export const handleChatHistory = async (
  socket: ExamSocket,
  _io: ExamServer,
  payload: { otherUserId: string },
): Promise<void> => {
  const { otherUserId } = payload;
  const { userId, role } = socket.data;

  if (!CHAT_ROLES.has(role) || !otherUserId) {
    socket.emit("exam:error", { message: "Permintaan riwayat chat tidak valid." });
    return;
  }

  const history = await chatRepo.getConversation(userId, otherUserId);
  await chatRepo.markRead(userId, otherUserId);

  socket.emit("chat:history", {
    otherUserId,
    messages: history.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.sender.fullname,
      senderRole: m.sender.role,
      receiverId: m.receiverId,
      receiverName: m.receiver.fullname,
      receiverRole: m.receiver.role,
      message: m.message,
      timestamp: m.createdAt.toISOString(),
      replyToId: m.replyToId ?? null,
      replyTo: m.replyTo ?? null,
    })),
  });
};

export const handleDisconnect = async (socket: ExamSocket, io: ExamServer): Promise<void> => {
  const { userId, username, fullname, role } = socket.data;
  if (!userId) return;

  if (role !== "PARTICIPANT") return;

  const participants = await prisma.examParticipant.findMany({
    where: { userId },
    select: { examRoomId: true },
  });

  for (const { examRoomId } of participants) {
    const socketIdInRedis = await redisClient.get(redisKeys.socketId(examRoomId, userId));

    if (socketIdInRedis !== socket.id) continue;

    // Grace Period: 60 seconds
    const disconnectTimerKey = `exam_disconnect_timer:${examRoomId}:${userId}`;
    await redisClient.set(disconnectTimerKey, "1", { EX: 60 });

    const { examName, roomName } = await getExamRoomMeta(examRoomId);
    
    // Emit temporary disconnect status to UI, but no DB notifications yet
    io.to(redisKeys.supervisorRoom(examRoomId)).emit("exam:participant:disconnected", {
      userId,
      username,
      fullname,
      examRoomId,
      examName,
      roomName,
      isGracePeriod: true
    });

    setTimeout(async () => {
      try {
        const stillDisconnected = await redisClient.exists(disconnectTimerKey);
        if (!stillDisconnected) return; // Reconnected within grace period

        await redisClient.del(disconnectTimerKey);
        await redisClient.del(redisKeys.socketId(examRoomId, userId));

        // Mock socket object to fulfill handleViolation signature safely
        const mockSocket = { data: { userId, username }, emit: () => {} } as unknown as ExamSocket;
        await handleViolation(mockSocket, io, { examRoomId, violationType: ViolationType.WINDOW_CLOSED });

        io.to("admins").emit("exam:participant:disconnected", {
          userId,
          username,
          fullname,
          examRoomId,
          examName,
          roomName,
          isGracePeriod: false
        });

        await saveLog(
          examRoomId,
          "disconnect",
          `${fullname} terputus lebih dari 60 detik (Keluar Ujian).`,
          userId,
        );
      } catch (err) {
        logger.error({ err, userId, examRoomId }, "Error processing delayed disconnect");
      }
    }, 60000);
  }
};
