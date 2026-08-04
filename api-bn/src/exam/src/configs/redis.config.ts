import { createClient } from "redis";

export const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

export const redisClient = createClient({ url: redisUrl });

export const connectRedis = async (): Promise<void> => {
  await redisClient.connect();
};
