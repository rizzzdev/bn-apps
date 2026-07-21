import { type PrismaClient } from "../../app/database/generated/client.js";
import { getIO } from "../../socket/socket-manager.js";
import { NotificationRepository } from "./notification.repository.js";

/**
 * Pushes a notification live over Socket.IO to each user's personal
 * `user:<id>` room. Call this alongside persisting the notification so it
 * shows up immediately instead of only after the next page load. Best-effort
 * — failures here must never break the caller's main flow.
 */
export function pushLiveNotifications(
  userIds: string[],
  type: string,
  title: string,
  message: string,
  meta?: string | null,
): void {
  try {
    const io = getIO();
    if (!io) return;
    for (const userId of userIds) {
      io.to(`user:${userId}`).emit("notification", { type, title, message, meta: meta ?? undefined });
    }
  } catch {
    // live push failure should never crash the caller
  }
}

/**
 * Persists a notification for each user and pushes it live (see
 * `pushLiveNotifications`). Use this when the caller doesn't already have a
 * NotificationRepository instance handy.
 */
export async function notifyUsers(
  prisma: PrismaClient,
  userIds: string[],
  type: string,
  title: string,
  message: string,
  meta?: string | null,
): Promise<void> {
  if (userIds.length === 0) return;

  try {
    const repo = new NotificationRepository(prisma);
    await repo.createMany(userIds.map((userId) => ({ userId, type, title, message, meta })));
  } catch {
    // notification save failure should never crash the caller
  }

  pushLiveNotifications(userIds, type, title, message, meta);
}
