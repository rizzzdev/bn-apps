import { pinoHttp } from "pino-http";
import { randomUUID } from "crypto";
import { logger } from "../../utils/logger.js";
import { type Request, type Response } from "express";

/**
 * HTTP access logger middleware powered by pino-http.
 * Assigns a UUID correlationId to every request via req.id.
 * Logs one structured JSON line per response; level escalates to warn (4xx) or error (5xx).
 */
export const requestLogger = pinoHttp({
  logger,
  genReqId: (_request: Request, response: Response) => {
    const id = randomUUID();
    response.setHeader("X-Request-Id", id);
    return id;
  },
  customLogLevel: (_request: Request, response: Response, error: Error | undefined) => {
    if (error !== undefined || response.statusCode >= 500) {
      return "error";
    }
    if (response.statusCode >= 400) {
      return "warn";
    }
    return "info";
  },
  serializers: {
    req: (request: Request) => ({
      id: request.id,
      method: request.method,
      url: request.url,
    }),
    res: (response: Response) => ({
      statusCode: response.statusCode,
    }),
  },
});
