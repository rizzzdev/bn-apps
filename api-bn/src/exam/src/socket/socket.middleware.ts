import { type Socket } from "socket.io";
import { sentriAuth } from "#auth";
import { prisma } from "#exam/database/index.js";
import { toExamRole } from "#exam/utils/roles.js";
import { getOrchestrator } from "#app/orchestrator.js";
import {
  type ClientToServerEvents,
  type ServerToClientEvents,
  type SocketData,
} from "./socket.types.js";

type ExamSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

export const socketAuthMiddleware = async (
  socket: ExamSocket,
  next: (err?: Error) => void,
): Promise<void> => {
  const token = socket.handshake.auth.token as string | undefined;

  if (!token) {
    next(new Error("Authentication error: token missing"));
    return;
  }

  try {
    const payload = sentriAuth.verifyAccessToken(token);
    const role = toExamRole(payload.roles) ?? "student";

    // Resolve display name from shadow DB (teacher/student) or admin email.
    let name = payload.id;
    const [teacher, student] = await Promise.all([
      prisma.shadowTeacher.findFirst({ where: { userId: payload.id, deletedAt: null } }),
      prisma.shadowStudent.findFirst({ where: { userId: payload.id, deletedAt: null } }),
    ]);
    if (teacher) {
      name = teacher.fullname;
    } else if (student) {
      name = student.fullname;
    } else if (role === "super_admin") {
      try {
        const admins = await getOrchestrator().authData.findAllByRoles(["super_admin"]);
        const admin = admins.find((a) => a.id === payload.id);
        if (admin?.email) name = admin.email;
      } catch {
        // best-effort — never block a socket connection on admin resolution
      }
    }

    socket.data.userId = payload.id;
    socket.data.username = name;
    socket.data.fullname = name;
    socket.data.role = role;
    next();
  } catch {
    next(new Error("Authentication error: invalid token"));
  }
};
