import { type Socket } from "socket.io";
import { verifyAccessToken } from "../utils/token.js";
import { redisClient } from "../configs/redis.config.js";
import { prisma } from "../app/database/index.js";
import { type TokenPayload } from "../modules/auth/auth.types.js";
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
    const payload = verifyAccessToken(token) as TokenPayload;

    // Validate session exists in Redis
    const sessionToken = await redisClient.get(`user_session:${payload.id}`);
    if (!sessionToken || sessionToken !== token) {
      next(new Error("Authentication error: session expired or invalid"));
      return;
    }

    const user = await prisma.user.findFirst({
      where: { id: payload.id },
      select: { fullname: true },
    });

    socket.data.userId = payload.id;
    socket.data.username = payload.username;
    socket.data.fullname = user?.fullname ?? payload.username;
    socket.data.role = payload.role;
    next();
  } catch {
    next(new Error("Authentication error: invalid token"));
  }
};
