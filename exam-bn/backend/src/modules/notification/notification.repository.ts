import { type PrismaClient } from "../../app/database/generated/client.js";
import { type Notification, type CreateNotificationDto } from "./notification.types.js";
import { redisClient } from "../../configs/redis.config.js";

export class NotificationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  getByUser = async (userId: string): Promise<Notification[]> => {
    const cacheKey = `notifications:${userId}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const data = await this.prisma.notification.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
    }) as unknown as Promise<Notification[]>;

    await redisClient.set(cacheKey, JSON.stringify(data), { EX: 1800 });
    return data;
  };

  createMany = async (dtos: CreateNotificationDto[]): Promise<void> => {
    if (dtos.length === 0) return;
    await this.prisma.notification.createMany({ data: dtos });
    
    const userIds = [...new Set(dtos.map(d => d.userId))];
    for (const userId of userIds) {
      await redisClient.del(`notifications:${userId}`);
    }
  };

  markAllRead = async (userId: string): Promise<void> => {
    await this.prisma.notification.updateMany({
      where: { userId, deletedAt: null, read: false },
      data: { read: true },
    });
    await redisClient.del(`notifications:${userId}`);
  };

  bulkSoftDelete = async (userId: string): Promise<void> => {
    await this.prisma.notification.updateMany({
      where: { userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    await redisClient.del(`notifications:${userId}`);
  };
}
