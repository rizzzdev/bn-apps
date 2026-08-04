import { type Server as HttpServer } from "http";
import { Server } from "socket.io";
import { env } from "#app/configs/env.js";
import { socketAuthMiddleware } from "./socket.middleware.js";
import {
  handleParticipantJoin,
  handleSupervisorJoin,
  handleMonitorJoin,
  handleStatusSubscribe,
  handleViolation,
  handleUnlock,
  handleStart,
  handleWarn,
  handleChatSend,
  handleChatHistory,
  handleDisconnect,
} from "./socket.handler.js";
import {
  type ClientToServerEvents,
  type ServerToClientEvents,
  type SocketData,
} from "./socket.types.js";
import { logger } from "../utils/logger.js";
import { setIO } from "./socket-manager.js";

// Tracks how many active sockets each userId has; key removed when count reaches 0.
const userSocketCounts = new Map<string, number>();

export const initSocket = (
  httpServer: HttpServer,
): Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData> => {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >(httpServer, {
    cors: {
      origin:
        env.NODE_ENV === "development"
          ? true
          : env.CLIENT_URLS.map((o) => o.replace(/\/+$/, "")),
      methods: ["GET", "POST"],
      credentials: true,
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    },
  });

  setIO(io);

  // Apply auth middleware
  io.use((socket, next) => void socketAuthMiddleware(socket, next));

  const onUserConnect = (userId: string): void => {
    userSocketCounts.set(userId, (userSocketCounts.get(userId) ?? 0) + 1);
    io.emit("online:count", { count: userSocketCounts.size });
  };

  const onUserDisconnect = (userId: string): void => {
    const remaining = (userSocketCounts.get(userId) ?? 1) - 1;
    if (remaining <= 0) {
      userSocketCounts.delete(userId);
    } else {
      userSocketCounts.set(userId, remaining);
    }
    io.emit("online:count", { count: userSocketCounts.size });
  };

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id, userId: socket.data.userId }, "Socket connected");

    onUserConnect(socket.data.userId);

    if (socket.data.role === "super_admin") {
      void socket.join("admins");
    }

    // Personal room — lets direct chat and live notifications reach a user on
    // any page/device, without needing to join a specific exam room first.
    void socket.join(`user:${socket.data.userId}`);

    socket.on("exam:join", (payload) => {
      void handleParticipantJoin(socket, io, payload);
    });

    socket.on("exam:supervisor:join", (payload) => {
      void handleSupervisorJoin(socket, io, payload);
    });

    socket.on("exam:monitor:join", (payload) => {
      void handleMonitorJoin(socket, io, payload);
    });

    socket.on("exam:status:subscribe", (payload) => {
      void handleStatusSubscribe(socket, io, payload);
    });

    socket.on("exam:violation", (payload) => {
      void handleViolation(socket, io, payload);
    });

    socket.on("exam:unlock", (payload) => {
      void handleUnlock(socket, io, payload);
    });

    socket.on("exam:start", (payload) => {
      void handleStart(socket, io, payload);
    });

    socket.on("exam:warn", (payload) => {
      void handleWarn(socket, io, payload);
    });

    socket.on("chat:send", (payload) => {
      void handleChatSend(socket, io, payload);
    });

    socket.on("chat:history", (payload) => {
      void handleChatHistory(socket, io, payload);
    });

    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id, userId: socket.data.userId }, "Socket disconnected");
      onUserDisconnect(socket.data.userId);
      void handleDisconnect(socket, io);
    });
  });

  return io;
};
