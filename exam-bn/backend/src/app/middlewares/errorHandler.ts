import { type Request, type Response, type NextFunction } from "express";
import { AppError } from "../../utils/errors.js";
import { sendError } from "../../utils/response.js";
import { StatusCode } from "../../types/api.js";
import { logger } from "../../utils/logger.js";

/**
 * Centralized error handler. Must be registered AFTER all routes (via registerErrorHandler).
 * - AppError subclasses produce structured warn/error logs.
 * - Unknown errors produce an error log and return a generic 500.
 */
export const errorHandler = (
  error: Error,
  request: Request,
  response: Response,
  _next: NextFunction,
): void => {
  const requestId = (request as Request & { id?: string }).id;

  if (!(error instanceof AppError)) {
    // Prisma foreign key constraint violation → 409 Conflict
    const prismaError = error as Error & { code?: string };
    if (prismaError.code === "P2003") {
      logger.warn({ err: error, requestId }, "Foreign key constraint violation");
      sendError(
        response,
        "Data tidak dapat dihapus karena masih digunakan oleh data lain.",
        StatusCode.CONFLICT,
      );
      return;
    }
    // Prisma unique constraint violation → 409 Conflict
    if (prismaError.code === "P2002") {
      logger.warn({ err: error, requestId }, "Unique constraint violation");
      sendError(response, "Data sudah ada (duplikat).", StatusCode.CONFLICT);
      return;
    }
    // Prisma record not found (update/delete on non-existent row) → 404
    if (prismaError.code === "P2025") {
      logger.warn({ err: error, requestId }, "Record not found");
      sendError(response, "Data tidak ditemukan.", StatusCode.NOT_FOUND);
      return;
    }
    logger.error({ err: error, requestId }, "Unhandled error");
    sendError(response, "Internal server error", StatusCode.INTERNAL_SERVER_ERROR);
    return;
  }

  if (error.statusCode >= 500) {
    logger.error({ err: error, requestId }, error.message);
  } else {
    logger.warn({ err: error, requestId }, error.message);
  }
  sendError(response, error.message, error.statusCode);
};
