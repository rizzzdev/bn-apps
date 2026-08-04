/**
 * Worker thread entry untuk menjalankan backtracking engine.
 *
 * Worker thread ini dipakai sebagai FALLBACK ketika Redis tidak tersedia,
 * agar event loop utama proses API tetap bebas selama engine (CPU-bound)
 * melakukan backtracking. Input & output berupa data murni (JSON-safe).
 */
import { parentPort } from "node:worker_threads";
import { backtrackingEngine } from "./backtracking-engine";

parentPort!.on("message", (engineInput: unknown) => {
  try {
    const result = backtrackingEngine.solve(engineInput as never);
    parentPort!.postMessage({ ok: true, result });
  } catch (err: unknown) {
    parentPort!.postMessage({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});
