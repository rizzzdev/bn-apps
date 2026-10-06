import { vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

/**
 * Mock Express req/res/next untuk test controller. Controller di codebase ini
 * selalu tipis: parse req -> panggil service (nyata, terhubung ke DB test) ->
 * sendResponse(res, ...) atau next(error). Jadi cukup mock request & tangkap
 * apa yang dikirim ke res.status/json/set/send serta ke next().
 */
export function createMockReq(overrides: Partial<Request> = {}): Request {
  return {
    params: {},
    query: {},
    body: {},
    ...overrides,
  } as unknown as Request;
}

export function createMockRes(): Response {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.set = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res as Response;
}

export function createMockNext(): NextFunction {
  return vi.fn() as unknown as NextFunction;
}

/** Ambil argumen error pertama yang dikirim ke next(err), atau undefined kalau belum pernah dipanggil. */
export function getNextError(next: NextFunction): unknown {
  const mock = next as unknown as ReturnType<typeof vi.fn>;
  return mock.mock.calls[0]?.[0];
}

/** Ambil body JSON terakhir yang dikirim lewat res.json(...). */
export function getJsonBody(res: Response): any {
  const mock = res.json as unknown as ReturnType<typeof vi.fn>;
  return mock.mock.calls.at(-1)?.[0];
}
