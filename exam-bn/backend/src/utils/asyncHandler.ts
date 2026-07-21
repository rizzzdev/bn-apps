import { type Request, type Response, type NextFunction } from "express";

type AsyncRequestHandler = (
  request: Request,
  response: Response,
  next: NextFunction,
) => Promise<void>;

/**
 * Wraps an async Express route handler so rejected promises are forwarded to next().
 * Eliminates manual try/catch boilerplate in every controller method.
 */
export const asyncHandler = (fn: AsyncRequestHandler) => {
  return (request: Request, response: Response, next: NextFunction): void => {
    fn(request, response, next).catch(next);
  };
};
