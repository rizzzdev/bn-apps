import { createApp, env } from "#app";
import { sentriAuth } from "#auth";
import { createServer } from "http";
import { connectRedis } from "#exam/configs/redis.config.js";
import { initSocket } from "#exam/socket/index.js";
import { initExamScheduling } from "#exam/socket/exam-queue.js";
import { startTimetableWorker, closeTimetableWorker } from "#academic/modules/timetable-generator/service/timetable-queue.js";

const app = createApp();
const port = env.PORT;

if (process.env.VERCEL !== "1") {
  const httpServer = createServer(app);
  initSocket(httpServer);

  try {
    await connectRedis();
  } catch (err) {
    console.warn("[exam] Redis unavailable — exam socket/lifecycle disabled:", err);
  }

  try {
    await initExamScheduling();
  } catch (err) {
    console.warn("[exam] Exam scheduling init failed:", err);
  }

  // Worker generator jadwal IN-PROCESS — engine berjalan di worker thread,
  // jadi tidak perlu proses worker terpisah (npm run dev/start langsung jalan).
  startTimetableWorker();

  const server = httpServer.listen(port, () => {
    sentriAuth.migrate();
    console.log(`server running on port ${port}.`);
  });

  const shutdown = async (): Promise<void> => {
    console.log("Shutting down gracefully...");

    const forceExit = setTimeout(() => {
      console.error("Forced shutdown — timeout exceeded");
      process.exit(1);
    }, 10_000);

    server.close();
    await closeTimetableWorker();
    clearTimeout(forceExit);
    process.exit(0);
  };

  process.once("SIGTERM", () => void shutdown());
  process.once("SIGINT", () => void shutdown());
}
