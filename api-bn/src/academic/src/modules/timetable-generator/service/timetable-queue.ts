/**
 * Queue BullMQ untuk job generasi preview jadwal pelajaran.
 *
 * Jalur utama: POST /preview → enqueue job → worker (in-process di API,
 * atau proses terpisah via `npm run worker`) menjalankan backtracking engine di
 * worker thread. Dengan begitu event loop proses API tetap bebas meskipun
 * engine berjalan lama.
 *
 * Jika Redis tidak tersedia, pemanggil (GeneratorService) akan memakai fallback
 * worker thread — tidak ada error yang dilempar hanya karena Redis mati.
 */
import { Queue, Worker, type Job } from "bullmq";
import { runEngineInWorker } from "./engine-runner";
import IORedis from "ioredis";
import { env } from "#app";
import type { EngineInput } from "./backtracking-engine";

const QUEUE_NAME = "timetable-generation";
const HEALTH_CACHE_MS = 2000;
const PING_TIMEOUT_MS = 1200;

const redisConfigured = Boolean(env.REDIS_URL);

let connection: IORedis | null = null;
let queue: Queue | null = null;
let lastHealthCheck = 0;
let lastHealthResult = false;

function getConnection(): IORedis | null {
  if (!redisConfigured) return null;
  if (!connection) {
    connection = new IORedis(env.REDIS_URL as string, {
      // Persyaratan BullMQ: tidak boleh retry per-command (jika tidak, antrian
      // akan menganggap koneksi gagal dan error bercampur dengan data job).
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });
    // Error koneksi ditangani lewat health check, jangan sampai mematikan proses.
    connection.on("error", () => {});
  }
  return connection;
}

function getQueue(): Queue | null {
  if (!redisConfigured) return null;
  const conn = getConnection();
  if (!conn) return null;
  if (!queue) {
    queue = new Queue(QUEUE_NAME, {
      connection: conn,
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 50 },
      },
    });
  }
  return queue;
}

/** Cek cepat ketersediaan Redis (hasil di-cache 2 detik agar tidak membebani). */
export async function isRedisAvailable(): Promise<boolean> {
  const now = Date.now();
  if (now - lastHealthCheck < HEALTH_CACHE_MS) return lastHealthResult;

  const conn = getConnection();
  let available = false;
  if (conn) {
    if (conn.status === "ready") {
      // Sudah terkoneksi — tanpa ping supaya tidak kena race saat connecting.
      available = true;
    } else {
      try {
        const result = await Promise.race([
          conn.ping(),
          new Promise<"timeout">((resolve) =>
            setTimeout(() => resolve("timeout"), PING_TIMEOUT_MS),
          ),
        ]);
        available = result === "PONG";
      } catch {
        available = false;
      }
    }
  }

  lastHealthCheck = now;
  lastHealthResult = available;
  return available;
}

/** Reset cache kesehatan agar request berikutnya memeriksa ulang Redis. */
export function invalidateRedisHealth(): void {
  lastHealthCheck = 0;
  lastHealthResult = false;
}

/** Kirim job generate preview ke antrian. Kembalikan jobId untuk dipoll. */
export async function enqueuePreview(
  engineInput: EngineInput,
): Promise<string> {
  const q = getQueue();
  if (!q) {
    throw new Error(
      "Antrian generator tidak tersedia (REDIS_URL belum disetel).",
    );
  }
  const job = await q.add("generate-preview", { engineInput });
  return job.id as string;
}

/** Ambil status & hasil job preview berdasarkan jobId. */
export async function getPreviewJob(jobId: string): Promise<Job | null> {
  const q = getQueue();
  if (!q) return null;
  return (await q.getJob(jobId)) ?? null;
}

// ---------------------------------------------------------------------------
// Worker IN-PROCESS
// ---------------------------------------------------------------------------
// Worker dijalankan di dalam proses API sehingga `npm run dev` / `npm run start`
// langsung berfungsi tanpa proses terpisah. Engine tetap dijalankan di worker
// thread agar event loop API tidak pernah terblokir oleh backtracking (CPU-bound).

let inProcessWorker: Worker | null = null;
let inProcessConnection: IORedis | null = null;

export function startTimetableWorker(): void {
  if (inProcessWorker) return;
  if (!redisConfigured) {
    console.warn(
      "[timetable] REDIS_URL tidak disetel — worker in-process tidak dijalankan (fallback worker thread aktif).",
    );
    return;
  }
  try {
    // Koneksi terpisah dari Queue — BullMQ menyarankan tidak berbagi koneksi
    // antara Queue dan Worker agar tidak saling memblokir.
    inProcessConnection = new IORedis(env.REDIS_URL as string, {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });
    inProcessConnection.on("error", () => {});

    const worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        const { engineInput } = job.data as { engineInput: EngineInput };
        const timeoutMs = engineInput.options?.timeoutMs ?? 15000;
        // Engine dijalankan di worker thread → event loop API tetap bebas.
        return runEngineInWorker(engineInput, timeoutMs);
      },
      { connection: inProcessConnection, concurrency: 1 },
    );

    worker.on("completed", (job) => {
      const ret = job.returnvalue as
        { stats?: { durationMs?: number } } | null | undefined;
      console.log(
        `[timetable] job ${job.id} selesai (${ret?.stats?.durationMs ?? "?"} ms).`,
      );
    });
    worker.on("failed", (job, err) => {
      console.error(`[timetable] job ${job?.id} gagal:`, err.message);
    });
    worker.on("error", (err) => {
      console.error("[timetable] worker error:", err.message);
    });

    inProcessWorker = worker;
    console.log(
      "[timetable] worker in-process siap — job generator diproses di worker thread terpisah.",
    );
  } catch (err) {
    console.warn("[timetable] Gagal memulai worker in-process:", err);
  }
}

export async function closeTimetableWorker(): Promise<void> {
  if (inProcessWorker) {
    // close(true): jangan menunggu job aktif selesai — shutdown harus cepat
    // agar tidak melampaui batas forceExit pada restart/deploy.
    await inProcessWorker.close(true).catch(() => {});
    inProcessWorker = null;
  }
  if (inProcessConnection) {
    await inProcessConnection.quit().catch(() => {});
    inProcessConnection = null;
  }
  // Tutup juga koneksi Queue (health check & enqueue).
  await closeQueue();
}

/** Tutup koneksi (dipakai saat graceful shutdown bila diperlukan). */
export async function closeQueue(): Promise<void> {
  if (queue) {
    await queue.close();
    queue = null;
  }
  if (connection) {
    await connection.quit().catch(() => {});
    connection = null;
  }
}
