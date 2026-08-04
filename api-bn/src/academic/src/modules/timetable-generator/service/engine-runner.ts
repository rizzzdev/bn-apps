/**
 * Menjalankan backtracking engine di dalam Worker Thread.
 *
 * Digunakan sebagai fallback ketika Redis (BullMQ) tidak tersedia, sehingga
 * request tetap dapat dilayani tanpa memblokir event loop utama Node.js.
 */
import { Worker } from "node:worker_threads";
import type { EngineInput } from "./backtracking-engine";
import type { GeneratorPreviewResult } from "../domain";

const SAFETY_BUFFER_MS = 5000;

export function runEngineInWorker(
  engineInput: EngineInput,
  timeoutMs: number,
): Promise<GeneratorPreviewResult> {
  return new Promise<GeneratorPreviewResult>((resolve, reject) => {
    const worker = new Worker(new URL("./engine.worker.ts", import.meta.url), {
      execArgv: ["--import", "tsx"],
    });

    // Engine sudah self-terminate via timeoutMs, tapi tambahkan batas keras
    // agar worker yang hang tidak menggantung request selamanya.
    const safetyTimer = setTimeout(() => {
      void worker.terminate();
      reject(
        new Error(
          "Generator melebihi batas waktu eksekusi. Coba naikkan timeout atau kurangi beban jadwal.",
        ),
      );
    }, timeoutMs + SAFETY_BUFFER_MS);

    const cleanup = (): void => {
      clearTimeout(safetyTimer);
      void worker.terminate();
    };

    worker.on(
      "message",
      (msg: {
        ok: boolean;
        result?: GeneratorPreviewResult;
        error?: string;
      }) => {
        cleanup();
        if (msg.ok) {
          resolve(msg.result as GeneratorPreviewResult);
        } else {
          reject(
            new Error(msg.error || "Worker generator gagal tanpa pesan error."),
          );
        }
      },
    );

    worker.on("error", (err) => {
      cleanup();
      reject(err);
    });

    worker.on("exit", (code) => {
      clearTimeout(safetyTimer);
      if (code !== 0) {
        reject(new Error(`Worker generator berhenti dengan kode ${code}.`));
      }
    });

    worker.postMessage(engineInput);
  });
}
