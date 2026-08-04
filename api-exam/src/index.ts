import { createApp } from "./app/server/index.js";
import { envConfig } from "./configs/env.config.js";
import { connectRedis, redisClient } from "./configs/redis.config.js";
import { prisma } from "./app/database/index.js";
import { logger } from "./utils/logger.js";
import { createServer } from "http";
import { initSocket } from "./socket/index.js";
import { initExamScheduling } from "./socket/exam-queue.js";

const SHUTDOWN_TIMEOUT_MS = 10_000;

const app = createApp();
const httpServer = createServer(app);
const io = initSocket(httpServer);

export default app;

if (process.env.VERCEL !== "1") {
  await connectRedis();

  await initExamScheduling();

  const server = httpServer.listen(envConfig.port, () => {
    logger.info({ port: envConfig.port, env: envConfig.nodeEnv }, "Server started");
  });

  const shutdown = async (): Promise<void> => {
    logger.info("Shutting down gracefully...");

    const forceExit = setTimeout(() => {
      logger.error("Forced shutdown — timeout exceeded");
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);

    // Lifecycle scheduled via BullMQ
    server.close();
    await prisma.$disconnect();
    if (redisClient.isOpen) await redisClient.disconnect();
    clearTimeout(forceExit);
    process.exit(0);
  };

  process.once("SIGTERM", () => void shutdown());
  process.once("SIGINT", () => void shutdown());
}
