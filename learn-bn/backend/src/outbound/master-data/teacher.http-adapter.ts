import { env } from "@/configs/env";
import type { ITeacherPort, Teacher } from "./teacher.port";

/**
 * HTTP adapter that talks to master-data-bn REST endpoints.
 * All failures (network, timeout, non-2xx) are softened to null/[] so the
 * consumer can decide upward how to handle them (e.g. fallback to cache).
 */
const TIMEOUT_MS = 5000;

interface Envelope<T> {
  data?: T;
}

export class HttpTeacherAdapter implements ITeacherPort {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = (baseUrl ?? env.MASTER_API_URL ?? "").replace(/\/$/, "");
  }

  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "X-Api-Key": env.API_KEY ?? "",
    };
  }

  private async fetchJson<T>(url: string): Promise<T | null> {
    try {
      const res = await fetch(url, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) {
        console.warn(`[teacher-adapter] ${url} returned status ${res.status}`);
        return null;
      }
      const body = (await res.json()) as Envelope<T> | T;
      if (body && typeof body === "object" && "data" in (body as Envelope<T>)) {
        return (body as Envelope<T>).data ?? null;
      }
      return body as T;
    } catch (e) {
      console.error(
        `[teacher-adapter] Failed to fetch ${url}:`,
        (e as Error).message,
      );
      return null;
    }
  }

  async getById(id: string): Promise<Teacher | null> {
    return this.fetchJson<Teacher>(
      `${this.baseUrl}/api/v1/teachers/${encodeURIComponent(id)}`,
    );
  }

  /**
   * Batch fetch via N parallel `getById` calls. Tolerates per-id failures:
   * any id whose GET fails / times out is omitted from the returned array.
   * Use this until master-data-bn exposes a real `GET /teachers?ids=` endpoint.
   */
  async getByIds(ids: string[]): Promise<Teacher[]> {
    if (ids.length === 0) return [];
    const settled = await Promise.allSettled(ids.map((id) => this.getById(id)));
    const out: Teacher[] = [];
    for (const r of settled) {
      if (r.status === "fulfilled" && r.value) out.push(r.value);
    }
    return out;
  }
}
