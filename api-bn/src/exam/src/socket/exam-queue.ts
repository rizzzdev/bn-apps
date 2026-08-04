import { Queue, Worker, type Job } from "bullmq";
import { redisUrl } from "#exam/configs/redis.config.js";
import { autoStartIfTime, autoEndIfTime } from "./exam-lifecycle.js";
import { getIO } from "./socket-manager.js";
import { logger } from "../utils/logger.js";
import { prisma } from "#exam/database/index.js";

/**
 * BullMQ uses IORedis under the hood which takes { host, port } — not a URL
 * string like the `redis` npm package does.  We parse the REDIS_URL env var
 * (defaults to redis://localhost:6379) into the parts BullMQ expects.
 */
function parseRedisUrl(url: string): { host: string; port: number } {
  try {
    const parsed = new URL(url);
    return { host: parsed.hostname || "127.0.0.1", port: Number(parsed.port) || 6379 };
  } catch {
    return { host: "127.0.0.1", port: 6379 };
  }
}

const connection = parseRedisUrl(redisUrl);

export const examQueue = new Queue("exam-lifecycle-queue", { connection });

const worker = new Worker(
  "exam-lifecycle-queue",
  async (job: Job) => {
    const io = getIO();
    if (!io) {
      logger.error("Socket IO not initialized for job " + job.id);
      return;
    }

    if (job.name === "exam-start") {
      await autoStartIfTime(job.data.examRoomId, io as any);
    } else if (job.name === "exam-end") {
      await autoEndIfTime(job.data.examRoomId, io as any);
    } else if (job.name === "exam-force-submit") {
      const { forceSubmitAbsentParticipants } = await import("#exam/modules/exam-room/exam-room.submit.js");
      await forceSubmitAbsentParticipants(job.data.examRoomId);
    } else if (job.name === "exam-sweep") {
      const activeRooms = await prisma.examRoom.findMany({
        where: {
          status: { in: ["PENDING", "ONGOING"] },
          deletedAt: null,
        },
      });
      for (const room of activeRooms) {
        if (room.status === "PENDING") {
          await autoStartIfTime(room.id, io as any);
        } else if (room.status === "ONGOING") {
          await autoEndIfTime(room.id, io as any);
        }
      }
    }
  },
  { connection }
);

worker.on("failed", (job, err) => {
  logger.error({ err, jobId: job?.id }, "Exam lifecycle job failed");
});

export const scheduleExamRoom = async (examRoomId: string, startTime: Date, endTime: Date): Promise<void> => {
  const startJobId = `exam-start-${examRoomId}`;
  const endJobId = `exam-end-${examRoomId}`;

  // Remove existing jobs if any
  const existingStart = await examQueue.getJob(startJobId);
  if (existingStart) await existingStart.remove();

  const existingEnd = await examQueue.getJob(endJobId);
  if (existingEnd) await existingEnd.remove();

  const now = Date.now();
  const startDelay = Math.max(0, new Date(startTime).getTime() - now);
  const endDelay = Math.max(0, new Date(endTime).getTime() - now);

  await examQueue.add("exam-start", { examRoomId }, { jobId: startJobId, delay: startDelay });
  await examQueue.add("exam-end", { examRoomId }, { jobId: endJobId, delay: endDelay });
};

export const initExamScheduling = async (): Promise<void> => {
  try {
    const activeRooms = await prisma.examRoom.findMany({
      where: {
        status: { in: ["PENDING", "ONGOING"] },
        deletedAt: null,
      },
      include: { exam: true },
    });

    for (const room of activeRooms) {
      if (room.exam) {
        await scheduleExamRoom(room.id, room.exam.startTime, room.exam.endTime);
      }
    }
    logger.info(`Scheduled ${activeRooms.length} active exam rooms via BullMQ`);

    await examQueue.add("exam-sweep", {}, {
      repeat: { pattern: "* * * * *" },
      jobId: "exam-sweep-cron",
    });
  } catch (err) {
    logger.error({ err }, "Failed to initialize exam scheduling");
  }
};
