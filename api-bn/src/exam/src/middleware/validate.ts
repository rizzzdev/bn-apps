import { type Request, type Response, type NextFunction } from "express";
import { ValidationError } from "#app/errors/index.js";

interface SchemaLike {
  safeParse(data: unknown): {
    success: boolean;
    data?: unknown;
    error?: { issues: Array<{ message: string }> };
  };
}

export const validate = (schema: SchemaLike) => {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const result = schema.safeParse(request.body);
    if (!result.success) {
      const messages = result.error!.issues.map((i) => i.message).join("; ");
      next(new ValidationError(messages));
      return;
    }
    request.body = result.data;
    next();
  };
};
