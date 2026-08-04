/**
 * Worker process BullMQ untuk generator jadwal pelajaran (jalur utama).
 *
 * Dijalankan sebagai PROSES TERPISAH dari API (`npm run worker` / service
 * `worker` di docker-compose), sehingga backtracking engine (CPU-bound) tidak
 * pernah memblokir event loop proses API.
 *
 * Jika Redis tidak tersedia, proses ini akan terus mencoba menyambung ulang
 * (retryStrategy). Selama Redis mati, request API otomatis memakai fallback
 * worker thread di sisi API — jadi tidak ada layanan yang berhenti total.
 */
import IORedis from "ioredis";
import { Worker } from "bullmq";
import { env } from "#app/configs/env.js";
import { backtrackingEngine } from "./backtracking-engine";

const QUEUE_NAME = "timetable-generation";

if (!env.REDIS_URL) {
  console.warn(
    "[timetable-worker] REDIS_URL tidak disetel — worker tidak dijalankan.",
  );
  process.exit(0);
}

const connection = new IORedis(env.REDIS_URL as string, {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { engineInput } = job.data as {
      engineInput: Parameters<typeof backtrackingEngine.solve>[0];
    };
    return backtrackingEngine.solve(engineInput);
  },
  { connection, concurrency: 1 },
);

worker.on("completed", (job) => {
  const ret = job.returnvalue as
    { stats?: { durationMs?: number } } | null | undefined;
  console.log(
    `[timetable-worker] job ${job.id} selesai (${ret?.stats?.durationMs ?? "?"} ms).`,
  );
});

worker.on("failed", (job, err) => {
  console.error(`[timetable-worker] job ${job?.id} gagal:`, err.message);
});

worker.on("error", (err) => {
  console.error("[timetable-worker] error:", err.message);
});

const shutdown = async (): Promise<void> => {
  console.log("[timetable-worker] shutdown...");
  await worker.close();
  await connection.quit().catch(() => {});
  process.exit(0);
};

process.once("SIGTERM", () => void shutdown());
process.once("SIGINT", () => void shutdown());

console.log("[timetable-worker] worker siap. Menunggu job...");
